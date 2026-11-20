import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '../../users/user-role';
import { extractCurrentUser } from '../decorators/current-user.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Autorização por papel, aplicada depois do `JwtAuthGuard`.
 * - sem `@Roles(...)` na rota: libera qualquer usuário autenticado;
 * - sem usuário na requisição: 401; conta desativada ou papel fora da lista: 403.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const user = extractCurrentUser(context);

    if (!user.isActive) {
      throw new ForbiddenException('Conta desativada.');
    }
    if (!required || required.length === 0) {
      return true;
    }
    if (!required.includes(user.role)) {
      throw new ForbiddenException('Seu papel de acesso não permite esta operação.');
    }
    return true;
  }
}
