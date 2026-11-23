import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersRepository } from '../../users/users.repository';
import { requireEnv } from '../../../common/env';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepository: UsersRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireEnv('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: number; email: string }) {
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Acesso não autorizado. Usuário inexistente.');
    }
    // conta desativada depois do login: o token ainda válido deixa de funcionar
    if (!user.active) {
      throw new UnauthorizedException('Acesso não autorizado. Conta desativada.');
    }
    const { hashPassword: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}