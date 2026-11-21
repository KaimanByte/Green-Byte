import { JwtStrategy } from './jwt.strategy';
import { UsersRepository } from '../../users/users.repository';

describe('JwtStrategy', () => {
  const repository = {} as UsersRepository;

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('é criada quando JWT_SECRET está definido', () => {
    process.env.JWT_SECRET = 'segredo-de-teste';
    expect(new JwtStrategy(repository)).toBeInstanceOf(JwtStrategy);
  });

  it('não sobe sem JWT_SECRET (sem chave padrão no código)', () => {
    delete process.env.JWT_SECRET;
    expect(() => new JwtStrategy(repository)).toThrow(/JWT_SECRET não configurada/);
  });

  describe('validate', () => {
    const stored = {
      id: 4,
      email: 'op@greenbyte.test',
      hashPassword: 'hash',
      role: 'operator' as const,
      active: true,
      createdAt: new Date('2026-11-01T00:00:00.000Z'),
    };
    const strategyFor = (user: typeof stored | null) => {
      process.env.JWT_SECRET = 'segredo-de-teste';
      return new JwtStrategy({ findById: async () => user } as unknown as UsersRepository);
    };

    it('devolve o usuário com o papel e sem o hash da senha', async () => {
      const user = await strategyFor(stored).validate({ sub: 4, email: stored.email });

      expect(user).toMatchObject({ id: 4, role: 'operator', active: true });
      expect(user).not.toHaveProperty('hashPassword');
    });

    it('usa o papel atual do banco, não o que estava no token (rebaixamento vale na hora)', async () => {
      const staleClaim = { sub: 4, email: stored.email, role: 'admin' };

      const user = await strategyFor(stored).validate(staleClaim);

      expect(user).toMatchObject({ id: 4, role: 'operator' });
    });

    it('propaga a falha ao consultar o usuário no banco', async () => {
      process.env.JWT_SECRET = 'segredo-de-teste';
      const failing = new JwtStrategy({
        findById: async () => {
          throw new Error('banco fora do ar');
        },
      } as unknown as UsersRepository);

      await expect(failing.validate({ sub: 4, email: stored.email })).rejects.toThrow('banco fora do ar');
    });

    it('recusa o token de uma conta desativada depois do login', async () => {
      await expect(
        strategyFor({ ...stored, active: false }).validate({ sub: 4, email: stored.email }),
      ).rejects.toThrow('Conta desativada');
    });

    it('recusa o token de um usuário que não existe mais', async () => {
      await expect(strategyFor(null).validate({ sub: 4, email: stored.email })).rejects.toThrow('Usuário inexistente');
    });
  });
});
