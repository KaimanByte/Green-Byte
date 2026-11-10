import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from './auth.module';
import { UsersRepository } from '../users/users.repository';

/** Monta o AuthModule sem banco: o repositório de usuários é substituído por um objeto vazio. */
const compileAuthModule = () =>
  Test.createTestingModule({ imports: [AuthModule] })
    .overrideProvider(UsersRepository)
    .useValue({})
    .compile();

describe('AuthModule', () => {
  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('assina o token com o JWT_SECRET do ambiente', async () => {
    process.env.JWT_SECRET = 'segredo-de-teste';
    const module = await compileAuthModule();
    const jwt = module.get(JwtService);

    const token = jwt.sign({ sub: 1, email: 'admin@teste.local' });

    expect(jwt.verify(token, { secret: 'segredo-de-teste' })).toMatchObject({ sub: 1, email: 'admin@teste.local' });
    // a chave padrão antiga não pode mais validar tokens
    expect(() => jwt.verify(token, { secret: 'default_secret_key' })).toThrow();
  });

  it('não sobe sem JWT_SECRET', async () => {
    delete process.env.JWT_SECRET;
    await expect(compileAuthModule()).rejects.toThrow(/JWT_SECRET não configurada/);
  });
});
