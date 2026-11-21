import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { jest } from '@jest/globals';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';
import { User } from '../users/users.schema';

describe('AuthService', () => {
  let service: AuthService;
  let findByEmail: jest.Mock<UsersRepository['findByEmail']>;
  let sign: jest.Mock<(payload: object) => string>;

  const user: User = {
    id: 7,
    email: 'admin@greenbyte.test',
    hashPassword: '',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
  };
  const publicUser = { id: 7, email: user.email, role: 'admin', isActive: true, createdAt: user.createdAt };

  beforeEach(() => {
    findByEmail = jest.fn<UsersRepository['findByEmail']>();
    sign = jest.fn<(payload: object) => string>();
    sign.mockReturnValue('signed-jwt');

    service = new AuthService({ sign } as unknown as JwtService, { findByEmail } as unknown as UsersRepository);
  });

  it('autentica credenciais válidas e nunca devolve o hash da senha', async () => {
    findByEmail.mockResolvedValue({ ...user, hashPassword: await bcrypt.hash('SenhaSegura123!', 4) });

    await expect(service.validateUser(user.email, 'SenhaSegura123!')).resolves.toEqual(publicUser);
  });

  it('rejeita e-mail inexistente com a mesma resposta usada para senha inválida', async () => {
    findByEmail.mockResolvedValue(null);

    await expect(service.validateUser('ausente@greenbyte.test', 'qualquer')).rejects.toThrow(
      new UnauthorizedException('Email ou senha inválidos.'),
    );
  });

  it('rejeita senha incorreta com a mesma resposta de credencial inexistente', async () => {
    findByEmail.mockResolvedValue({ ...user, hashPassword: await bcrypt.hash('SenhaCorreta123!', 4) });

    await expect(service.validateUser(user.email, 'SenhaErrada123!')).rejects.toThrow(
      new UnauthorizedException('Email ou senha inválidos.'),
    );
  });

  it('bloqueia login de conta desativada (401), mesmo com senha correta', async () => {
    findByEmail.mockResolvedValue({ ...user, isActive: false, hashPassword: await bcrypt.hash('SenhaSegura123!', 4) });

    await expect(service.login({ email: user.email, password: 'SenhaSegura123!' })).rejects.toThrow(
      new UnauthorizedException('Conta desativada. Procure um administrador.'),
    );
    expect(sign).not.toHaveBeenCalled();
  });

  it('conta desativada com senha errada recebe a resposta genérica (não revela o status)', async () => {
    findByEmail.mockResolvedValue({ ...user, isActive: false, hashPassword: await bcrypt.hash('Outra123!', 4) });

    await expect(service.validateUser(user.email, 'SenhaSegura123!')).rejects.toThrow('Email ou senha inválidos.');
  });

  it('emite JWT com id, e-mail e papel depois de validar o usuário', async () => {
    findByEmail.mockResolvedValue({ ...user, hashPassword: await bcrypt.hash('SenhaSegura123!', 4) });

    await expect(service.login({ email: user.email, password: 'SenhaSegura123!' })).resolves.toEqual({
      access_token: 'signed-jwt',
      user: publicUser,
    });
    expect(sign).toHaveBeenCalledWith({ sub: user.id, email: user.email, role: 'admin' });
  });

  it('emite JWT com papel operator para operador ativo e propaga erros de repositório ou JWT', async () => {
    const operator: User = {
      ...user,
      id: 9,
      email: 'op@greenbyte.test',
      role: 'operator',
      hashPassword: await bcrypt.hash('SenhaOp123!', 4),
    };
    findByEmail.mockResolvedValueOnce(operator);

    const result = await service.login({ email: operator.email, password: 'SenhaOp123!' });
    expect(result.user).toEqual({
      id: 9,
      email: operator.email,
      role: 'operator',
      isActive: true,
      createdAt: operator.createdAt,
    });
    expect(result.user).not.toHaveProperty('hashPassword');
    expect(sign).toHaveBeenCalledWith({ sub: 9, email: operator.email, role: 'operator' });

    findByEmail.mockRejectedValueOnce(new Error('DB offline'));
    await expect(service.login({ email: operator.email, password: 'SenhaOp123!' })).rejects.toThrow('DB offline');

    findByEmail.mockResolvedValueOnce(operator);
    sign.mockImplementationOnce(() => {
      throw new Error('Falha ao assinar JWT');
    });
    await expect(service.login({ email: operator.email, password: 'SenhaOp123!' })).rejects.toThrow(
      'Falha ao assinar JWT',
    );
  });
});
