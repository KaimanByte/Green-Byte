import { jest } from '@jest/globals';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: UsersRepository, useValue: {} }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('UsersService: administrador inicial', () => {
  const repository = {
    findAll: jest.fn<() => Promise<unknown[]>>(),
    create: jest.fn<(data: { email: string; hashPassword: string }) => Promise<unknown>>(),
  };
  let service: UsersService;
  let logSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    repository.findAll.mockReset().mockResolvedValue([]);
    repository.create.mockReset().mockResolvedValue({});
    process.env.ADM_EMAIL = 'admin@teste.local';
    process.env.ADM_PASSWORD = 'senha-de-teste';
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    service = new UsersService(repository as unknown as UsersRepository);
  });

  afterEach(() => {
    delete process.env.ADM_EMAIL;
    delete process.env.ADM_PASSWORD;
    logSpy.mockRestore();
  });

  it('cria o administrador com o e-mail e a senha do .env quando não há usuários', async () => {
    await service.onModuleInit();

    expect(repository.create).toHaveBeenCalledTimes(1);
    const created = repository.create.mock.calls[0][0];
    expect(created.email).toBe('admin@teste.local');
    // a senha é gravada como hash, nunca em texto puro
    expect(created.hashPassword).not.toBe('senha-de-teste');
    await expect(bcrypt.compare('senha-de-teste', created.hashPassword)).resolves.toBe(true);
  });

  it('não cria outro administrador quando já existe usuário', async () => {
    repository.findAll.mockResolvedValue([{ id: 1, email: 'ja@existe.com' }]);

    await service.onModuleInit();

    expect(repository.create).not.toHaveBeenCalled();
  });

  it.each(['ADM_EMAIL', 'ADM_PASSWORD'])('não sobe sem %s, mesmo com usuários no banco', async (name) => {
    delete process.env[name];
    repository.findAll.mockResolvedValue([{ id: 1, email: 'ja@existe.com' }]);

    await expect(service.onModuleInit()).rejects.toThrow(new RegExp(`${name} não configurada`));
    expect(repository.findAll).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });
});
