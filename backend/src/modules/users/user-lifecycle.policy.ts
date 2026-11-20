import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ADMIN_ROLE, isUserRole, UserRole } from './user-role';
import { PublicUser } from './users.schema';

/** Quem executa a ação: o usuário autenticado na requisição. */
export interface LifecycleActor {
  id: number;
}

/**
 * Regras de ciclo de vida das contas (AU-06), sem acesso a banco (SRP).
 *
 * Ações inseguras bloqueadas:
 * - o administrador autenticado não desativa, não remove nem rebaixa a própria conta (403);
 * - o último administrador ativo não pode ser desativado, removido nem rebaixado (400);
 * - papel diferente de `admin` ou `operator` é rejeitado (400).
 */
@Injectable()
export class UserLifecyclePolicy {
  assertValidRole(role: unknown): asserts role is UserRole {
    if (!isUserRole(role)) {
      throw new BadRequestException('Papel inválido: use "admin" ou "operator".');
    }
  }

  assertCanChangeRole(
    actor: LifecycleActor,
    target: PublicUser,
    nextRole: UserRole,
    activeAdmins: number,
  ): void {
    if (target.role !== ADMIN_ROLE || nextRole === ADMIN_ROLE) {
      return;
    }
    if (actor.id === target.id) {
      throw new ForbiddenException('Você não pode remover o papel de administrador da própria conta.');
    }
    this.assertNotLastActiveAdmin(target, activeAdmins);
  }

  assertCanChangeStatus(
    actor: LifecycleActor,
    target: PublicUser,
    nextActive: boolean,
    activeAdmins: number,
  ): void {
    if (nextActive) {
      return;
    }
    if (actor.id === target.id) {
      throw new ForbiddenException('Você não pode desativar a própria conta.');
    }
    this.assertNotLastActiveAdmin(target, activeAdmins);
  }

  assertCanRemove(actor: LifecycleActor, target: PublicUser, activeAdmins: number): void {
    if (actor.id === target.id) {
      throw new ForbiddenException('Você não pode remover a própria conta.');
    }
    this.assertNotLastActiveAdmin(target, activeAdmins);
  }

  private assertNotLastActiveAdmin(target: PublicUser, activeAdmins: number): void {
    if (target.role === ADMIN_ROLE && target.isActive && activeAdmins <= 1) {
      throw new BadRequestException('Operação bloqueada: o sistema precisa manter ao menos um administrador ativo.');
    }
  }
}
