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
});
