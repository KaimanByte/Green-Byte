import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from '../authenticated-user';

/**
 * Exige um Bearer token válido. A `JwtStrategy` recarrega o usuário do banco a cada
 * requisição, então contas removidas ou desativadas deixam de autenticar na hora (401).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthenticatedUser>(err: unknown, user: TUser | false | null): TUser {
    if (err instanceof UnauthorizedException) {
      throw err;
    }
    if (err || !user) {
      throw new UnauthorizedException('Autenticação necessária: envie um token Bearer válido.');
    }
    return user;
  }
}
