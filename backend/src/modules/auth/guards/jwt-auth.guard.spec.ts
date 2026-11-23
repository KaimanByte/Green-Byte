import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard.handleRequest', () => {
  const guard = new JwtAuthGuard();
  const user = { id: 1, email: 'admin@empresa.com', role: 'admin', active: true };

  it('devolve o usuário autenticado', () => {
    expect(guard.handleRequest(null, user)).toBe(user);
  });

  it('responde 401 com mensagem em português quando não há token válido', () => {
    for (const [err, missing] of [
      [null, false],
      [null, null],
      [new Error('jwt malformed'), false],
    ] as const) {
      expect(() => guard.handleRequest(err, missing)).toThrow(
        new UnauthorizedException('Autenticação necessária: envie um token Bearer válido.'),
      );
    }
  });

  it('mantém a mensagem dos 401 lançados pela JwtStrategy (ex.: conta desativada)', () => {
    const fromStrategy = new UnauthorizedException('Acesso não autorizado. Conta desativada.');

    expect(() => guard.handleRequest(fromStrategy, false)).toThrow(fromStrategy);
  });
});
