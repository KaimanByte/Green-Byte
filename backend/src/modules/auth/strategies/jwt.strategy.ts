import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersRepository } from '../../users/users.repository';
import { toPublicUser } from '../../users/users.schema';
import { requireEnv } from '../../../common/env';
import type { AuthenticatedUser, JwtPayload } from '../authenticated-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepository: UsersRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireEnv('JWT_SECRET'),
    });
  }

  /**
   * Recarrega o usuário do banco: papel e status valem na hora, mesmo com token antigo.
   * Usuário inexistente ou desativado → 401.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Acesso não autorizado. Usuário inexistente.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Acesso não autorizado. Conta desativada.');
    }
    return toPublicUser(user);
  }
}
