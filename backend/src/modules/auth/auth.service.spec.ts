import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { jest } from '@jest/globals';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';
import { User } from '../users/users.schema';

describe('AuthService', () => {
  let service: AuthService;
  let findByEmail: jest.MockedFunction<UsersRepository['findByEmail']>;
  let sign: jest.MockedFunction<JwtService['sign']>;

  const user: User = {
    id: 7,
    email: 'admin@greenbyte.test',
    hashPassword: '',
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    findByEmail = jest.fn<UsersRepository['findByEmail']>();
    sign = jest.fn<JwtService['sign']>();
    sign.mockReturnValue('signed-jwt');

    service = new AuthService(
      { sign } as unknown as JwtService,
      { findByEmail } as unknown as UsersRepository,
    );
  });

  it('autentica credenciais válidas e nunca devolve o hash da senha', async () => {
    const hashPassword = await bcrypt.hash('SenhaSegura123!', 4);
    findByEmail.mockResolvedValue({ ...user, hashPassword });

    await expect(service.validateUser(user.email, 'SenhaSegura123!')).resolves.toEqual({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    });
  });

  it('rejeita e-mail inexistente com a mesma resposta usada para senha inválida', async () => {
    findByEmail.mockResolvedValue(null);

    await expect(service.validateUser('ausente@greenbyte.test', 'qualquer')).rejects.toThrow(
      new UnauthorizedException('Email ou senha inválidos.'),
    );
    expect(findByEmail).toHaveBeenCalledWith('ausente@greenbyte.test');
  });

  it('rejeita senha incorreta com a mesma resposta de credencial inexistente', async () => {
    const hashPassword = await bcrypt.hash('SenhaCorreta123!', 4);
    findByEmail.mockResolvedValue({ ...user, hashPassword });

    await expect(service.validateUser(user.email, 'SenhaErrada123!')).rejects.toThrow(
      new UnauthorizedException('Email ou senha inválidos.'),
    );
  });

  it('emite JWT apenas depois de validar o usuário e usa id e e-mail no payload', async () => {
    const hashPassword = await bcrypt.hash('SenhaSegura123!', 4);
    findByEmail.mockResolvedValue({ ...user, hashPassword });

    await expect(service.login({ email: user.email, password: 'SenhaSegura123!' })).resolves.toEqual({
      access_token: 'signed-jwt',
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    });
    expect(sign).toHaveBeenCalledWith({ sub: user.id, email: user.email });
  });
});
