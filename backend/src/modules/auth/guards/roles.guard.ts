import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser, Role } from '../roles';

/**
 * Autorização por papel. Vem depois do JwtAuthGuard (que autentica e preenche `request.user`).
 * Sem @Roles na rota nem no controller, basta estar autenticado.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!allowed || allowed.length === 0) return true;

    const user = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>().user;
    if (!user || !allowed.includes(user.role)) {
      throw new ForbiddenException('Seu papel não permite esta ação.');
    }
    return true;
  }
}
