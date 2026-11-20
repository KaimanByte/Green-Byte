import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { PublicUser, toPublicUser } from '../users/users.schema';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import type { JwtPayload } from './authenticated-user';

const INVALID_CREDENTIALS = 'Email ou senha inválidos.';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersRepository: UsersRepository,
  ) {}

  /**
   * Valida credenciais. A checagem de conta desativada só acontece depois da senha
   * correta, para não revelar quais e-mails existem.
   */
  async validateUser(email: string, password: string): Promise<PublicUser> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.hashPassword))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Conta desativada. Procure um administrador.');
    }
    return toPublicUser(user);
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return { access_token: this.jwtService.sign(payload), user };
  }
}
