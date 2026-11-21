import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';
import { User, NewUser } from './users.schema';
import * as bcrypt from 'bcrypt';
import { requireEnv } from '../../common/env';
import { AuditActor, AuditService, diffFields } from '../audit/audit.service';
import { AuditChange } from '../audit/audit.schema';
import { DEFAULT_ROLE } from '../auth/roles';

type SafeUser = Omit<User, 'hashPassword'>;

function toSafeUser(user: User): SafeUser {
  const { hashPassword: _, ...safeUser } = user;
  return safeUser;
}

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly saltRounds = 10;

  constructor(
    private readonly userRepository: UsersRepository,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    await this.seedInitialUser();
  }

  private async seedInitialUser() {
    // lidas antes de consultar o banco: sem ADM_EMAIL e ADM_PASSWORD o backend não sobe,
    // em vez de criar o administrador com uma senha padrão escrita no código
    const defaultEmail = requireEnv('ADM_EMAIL');
    const defaultPassword = requireEnv('ADM_PASSWORD');

    const existingUsers = await this.userRepository.findAll();
    if (existingUsers.length === 0) {

      const hashedPassword = await bcrypt.hash(defaultPassword, this.saltRounds);
      
      await this.userRepository.create({
        email: defaultEmail,
        hashPassword: hashedPassword,
        role: 'admin',
      });

      console.log(`[UsersService] Usuário inicial criado: ${defaultEmail}`);
      return;
    }

    // a conta do .env é a de recuperação: se foi rebaixada ou desativada (pelo painel ou direto
    // no banco), volta a ser administradora ativa no boot, para o sistema nunca ficar sem admin
    const envAdmin = existingUsers.find((user) => user.email.toLowerCase() === defaultEmail.toLowerCase());
    if (envAdmin && (envAdmin.role !== 'admin' || !envAdmin.active)) {
      await this.userRepository.update(envAdmin.id, { role: 'admin', active: true });
      console.log(`[UsersService] Administrador do .env restaurado (papel admin, conta ativa): ${envAdmin.email}`);
    }
  }

  async create(createUserDto: CreateUserDto, actor: AuditActor): Promise<SafeUser> {
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.hashPassword, this.saltRounds);
    const user = await this.userRepository.create({
      email: createUserDto.email,
      hashPassword: hashedPassword,
      role: createUserDto.role ?? DEFAULT_ROLE,
    });

    await this.auditService.record(actor, 'user.create', user.email, [
      { field: 'role', from: null, to: user.role },
    ]);
    return toSafeUser(user);
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.userRepository.findAll();
    return users.map(toSafeUser).sort((a, b) => a.id - b.id);
  }

  async findById(id: number): Promise<SafeUser | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return toSafeUser(user);
  }

  async findByEmail(email: string): Promise<SafeUser | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return toSafeUser(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto, actor: AuditActor): Promise<SafeUser | null> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const updateUser: Partial<NewUser> = {};
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const existingUserWithEmail = await this.userRepository.findByEmail(updateUserDto.email);
      if (existingUserWithEmail && existingUserWithEmail.id !== id) {
        throw new ConflictException('Já existe um usuário com este e-mail.');
      }
      updateUser.email = updateUserDto.email;
    }
    if (updateUserDto.role !== undefined && updateUserDto.role !== existingUser.role) {
      updateUser.role = updateUserDto.role;
    }
    if (updateUserDto.active !== undefined && updateUserDto.active !== existingUser.active) {
      updateUser.active = updateUserDto.active;
    }

    const losesAdminAccess =
      existingUser.role === 'admin' &&
      existingUser.active &&
      ((updateUser.role !== undefined && updateUser.role !== 'admin') || updateUser.active === false);
    if (losesAdminAccess) {
      if (existingUser.id === actor.id) {
        throw new BadRequestException(
          'Você não pode rebaixar nem desativar a própria conta. Peça a outro administrador.',
        );
      }
      await this.assertAnotherActiveAdmin(existingUser.id);
    }

    if (updateUserDto.hashPassword) {
      updateUser.hashPassword = await bcrypt.hash(updateUserDto.hashPassword, this.saltRounds);
    }

    if (Object.keys(updateUser).length === 0) {
      return toSafeUser(existingUser);
    }

    const updatedUser = await this.userRepository.update(id, updateUser);
    if (!updatedUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const changes: AuditChange[] = diffFields(existingUser, updatedUser, ['email', 'role', 'active']);
    // a senha nunca vai para a auditoria: só o fato de ter sido trocada
    if (updateUser.hashPassword) {
      changes.push({ field: 'password', from: null, to: 'redefinida' });
    }
    await this.auditService.record(actor, 'user.update', updatedUser.email, changes);

    return toSafeUser(updatedUser);
  }

  async remove(id: number, actor: AuditActor): Promise<SafeUser | null> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    if (existingUser.id === actor.id) {
      throw new BadRequestException('Você não pode excluir a própria conta.');
    }
    if (existingUser.role === 'admin' && existingUser.active) {
      await this.assertAnotherActiveAdmin(existingUser.id);
    }

    const user = await this.userRepository.delete(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    await this.auditService.record(actor, 'user.delete', user.email);
    return toSafeUser(user);
  }

  /** O sistema nunca pode ficar sem um administrador ativo (ninguém conseguiria gerenciar usuários). */
  private async assertAnotherActiveAdmin(exceptUserId: number): Promise<void> {
    const users = await this.userRepository.findAll();
    const hasAnother = users.some((user) => user.id !== exceptUserId && user.role === 'admin' && user.active);
    if (!hasAnother) {
      throw new BadRequestException('É preciso manter ao menos um administrador ativo.');
    }
  }
}
