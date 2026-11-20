import { ConflictException, Injectable, Logger, NotFoundException, OnModuleInit, Optional } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { requireEnv } from '../../common/env';
import { AuditActor, AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LifecycleActor, UserLifecyclePolicy } from './user-lifecycle.policy';
import { ADMIN_ROLE, OPERATOR_ROLE } from './user-role';
import { UsersRepository } from './users.repository';
import { NewUser, PublicUser, toPublicUser, User } from './users.schema';

/**
 * Casos de uso de gestão de usuários (AU-06). As regras de segurança do ciclo de vida
 * ficam em `UserLifecyclePolicy`; a persistência, em `UsersRepository`.
 */
@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);
  private readonly saltRounds = 10;

  constructor(
    private readonly userRepository: UsersRepository,
    private readonly policy: UserLifecyclePolicy = new UserLifecyclePolicy(),
    @Optional() private readonly auditService?: AuditService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedInitialUser();
  }

  /**
   * Garante o administrador inicial (ADM_EMAIL / ADM_PASSWORD do .env):
   * - se não existir, é criado com papel `admin` e conta ativa;
   * - se existir (ex.: criado antes da coluna `role`, que entra como `operator`),
   *   é promovido a `admin` e reativado. A senha existente não é alterada.
   */
  private async seedInitialUser(): Promise<void> {
    // lidas antes de consultar o banco: sem ADM_EMAIL e ADM_PASSWORD o backend não sobe
    const email = requireEnv('ADM_EMAIL');
    const password = requireEnv('ADM_PASSWORD');

    const existing = await this.userRepository.findByEmail(email);
    if (!existing) {
      const hashPassword = await bcrypt.hash(password, this.saltRounds);
      await this.userRepository.create({ email, hashPassword, role: ADMIN_ROLE, isActive: true });
      this.logger.log(`Administrador inicial criado: ${email}`);
      return;
    }

    if (existing.role !== ADMIN_ROLE || !existing.isActive) {
      await this.userRepository.update(existing.id, { role: ADMIN_ROLE, isActive: true });
      this.logger.log(`Administrador inicial garantido (papel admin, conta ativa): ${email}`);
    }
  }

  async create(dto: CreateUserDto, actor?: LifecycleActor): Promise<PublicUser> {
    const role = dto.role ?? OPERATOR_ROLE;
    this.policy.assertValidRole(role);

    if (await this.userRepository.findByEmail(dto.email)) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    const user = await this.userRepository.create({
      email: dto.email,
      hashPassword: await bcrypt.hash(dto.hashPassword, this.saltRounds),
      role,
      isActive: dto.isActive ?? true,
    });
    const publicUser = toPublicUser(user);
    const auditActor = this.toAuditActor(actor);
    if (this.auditService && auditActor) {
      await this.auditService.recordUserCreated(auditActor, publicUser.id, publicUser);
    }
    return publicUser;
  }

  async findAll(): Promise<PublicUser[]> {
    const all = await this.userRepository.findAll();
    return all.map(toPublicUser);
  }

  async findById(id: number): Promise<PublicUser> {
    return toPublicUser(await this.getExisting(id));
  }

  async findByEmail(email: string): Promise<PublicUser> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return toPublicUser(user);
  }

  async update(id: number, dto: UpdateUserDto, actor: LifecycleActor): Promise<PublicUser> {
    const target = toPublicUser(await this.getExisting(id));
    const changes: Partial<NewUser> = {};

    if (dto.role !== undefined) {
      this.policy.assertValidRole(dto.role);
      if (dto.role !== target.role) {
        this.policy.assertCanChangeRole(actor, target, dto.role, await this.userRepository.countActiveAdmins());
        changes.role = dto.role;
      }
    }

    if (dto.email !== undefined && dto.email !== target.email) {
      const owner = await this.userRepository.findByEmail(dto.email);
      if (owner && owner.id !== id) {
        throw new ConflictException('Já existe um usuário com este e-mail.');
      }
      changes.email = dto.email;
    }

    if (dto.hashPassword !== undefined) {
      changes.hashPassword = await bcrypt.hash(dto.hashPassword, this.saltRounds);
    }

    if (dto.isActive !== undefined && dto.isActive !== target.isActive) {
      this.policy.assertCanChangeStatus(actor, target, dto.isActive, await this.userRepository.countActiveAdmins());
      changes.isActive = dto.isActive;
    }

    if (Object.keys(changes).length === 0) {
      return target;
    }
    const updated = toPublicUser(await this.persistUpdate(id, changes));
    const auditActor = this.toAuditActor(actor);
    if (this.auditService && auditActor) {
      const keys = Object.keys(changes);
      if (keys.length === 1 && keys[0] === 'isActive') {
        await this.auditService.recordUserStatusChanged(auditActor, id, target, updated);
      } else {
        await this.auditService.recordUserUpdated(auditActor, id, target, updated);
      }
    }
    return updated;
  }

  async setActive(id: number, isActive: boolean, actor: LifecycleActor): Promise<PublicUser> {
    const target = toPublicUser(await this.getExisting(id));
    this.policy.assertCanChangeStatus(actor, target, isActive, await this.userRepository.countActiveAdmins());

    if (target.isActive === isActive) {
      return target;
    }
    const updated = toPublicUser(await this.persistUpdate(id, { isActive }));
    const auditActor = this.toAuditActor(actor);
    if (this.auditService && auditActor) {
      await this.auditService.recordUserStatusChanged(auditActor, id, target, updated);
    }
    return updated;
  }

  async remove(id: number, actor: LifecycleActor): Promise<PublicUser> {
    const target = toPublicUser(await this.getExisting(id));
    this.policy.assertCanRemove(actor, target, await this.userRepository.countActiveAdmins());

    const removed = await this.userRepository.delete(id);
    if (!removed) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    const publicRemoved = toPublicUser(removed);
    const auditActor = this.toAuditActor(actor);
    if (this.auditService && auditActor) {
      await this.auditService.recordUserDeleted(auditActor, id, publicRemoved);
    }
    return publicRemoved;
  }

  private toAuditActor(actor?: LifecycleActor): AuditActor | null {
    if (!actor?.email || !actor?.role) {
      return null;
    }
    return { id: actor.id, email: actor.email, role: actor.role };
  }

  private async getExisting(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }

  private async persistUpdate(id: number, changes: Partial<NewUser>): Promise<User> {
    const updated = await this.userRepository.update(id, changes);
    if (!updated) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return updated;
  }
}
