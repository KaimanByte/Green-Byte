import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Exige um Bearer token válido. A JwtStrategy recarrega o usuário do banco a cada requisição,
 * então contas removidas ou desativadas deixam de autenticar na hora (401).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: unknown, user: TUser | false | null): TUser {
    // erros da própria JwtStrategy (usuário inexistente, conta desativada) mantêm a mensagem
    if (err instanceof UnauthorizedException) {
      throw err;
    }
    // token ausente, malformado ou expirado: mensagem única em português no lugar do "Unauthorized" do Passport
    if (err || !user) {
      throw new UnauthorizedException('Autenticação necessária: envie um token Bearer válido.');
    }
    return user;
  }
}
