import { jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersRepository } from '../../users/users.repository';
import { User } from '../../users/users.schema';

describe('JwtStrategy', () => {
  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('é criada quando JWT_SECRET está definido', () => {
    process.env.JWT_SECRET = 'segredo-de-teste';
    expect(new JwtStrategy({} as UsersRepository)).toBeInstanceOf(JwtStrategy);
  });

  it('não sobe sem JWT_SECRET (sem chave padrão no código)', () => {
    delete process.env.JWT_SECRET;
    expect(() => new JwtStrategy({} as UsersRepository)).toThrow(/JWT_SECRET não configurada/);
  });

  describe('validate', () => {
    const user: User = {
      id: 5,
      email: 'op@greenbyte.test',
      hashPassword: 'hash',
      role: 'operator',
      isActive: true,
      createdAt: new Date('2026-11-01T00:00:00.000Z'),
    };
    const findById = jest.fn<UsersRepository['findById']>();
    let strategy: JwtStrategy;

    beforeEach(() => {
      process.env.JWT_SECRET = 'segredo-de-teste';
      findById.mockReset();
      strategy = new JwtStrategy({ findById } as unknown as UsersRepository);
    });

    it('devolve o usuário atual do banco, sem hash', async () => {
      findById.mockResolvedValue(user);

      const result = await strategy.validate({ sub: 5, email: user.email, role: 'operator' });

      expect(result).toMatchObject({ id: 5, role: 'operator', isActive: true });
      expect(result).not.toHaveProperty('hashPassword');
    });

    it('401 para usuário removido', async () => {
      findById.mockResolvedValue(null);

      await expect(strategy.validate({ sub: 5, email: user.email, role: 'operator' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('401 para conta desativada, mesmo com token ainda válido', async () => {
      findById.mockResolvedValue({ ...user, isActive: false });

      await expect(strategy.validate({ sub: 5, email: user.email, role: 'operator' })).rejects.toThrow(
        'Acesso não autorizado. Conta desativada.',
      );
    });

    it('reflete o papel atualizado no banco mesmo com claim antigo e propaga erro de consulta', async () => {
      findById.mockResolvedValueOnce({ ...user, role: 'admin' });
      await expect(strategy.validate({ sub: 5, email: user.email, role: 'operator' })).resolves.toMatchObject({
        id: 5,
        role: 'admin',
      });

      findById.mockRejectedValueOnce(new Error('Falha no banco'));
      await expect(strategy.validate({ sub: 5, email: user.email, role: 'operator' })).rejects.toThrow(
        'Falha no banco',
      );
    });
  });
});
