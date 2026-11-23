import { jest } from '@jest/globals';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { AuditService } from '../audit/audit.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: {} },
        { provide: AuditService, useValue: {} },
      ],
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
    create: jest.fn<(data: { email: string; hashPassword: string; role?: string }) => Promise<unknown>>(),
    update: jest.fn<(id: number, data: Record<string, unknown>) => Promise<unknown>>(),
  };
  let service: UsersService;
  let logSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    repository.findAll.mockReset().mockResolvedValue([]);
    repository.create.mockReset().mockResolvedValue({});
    repository.update.mockReset().mockResolvedValue({});
    process.env.ADM_EMAIL = 'admin@teste.local';
    process.env.ADM_PASSWORD = 'senha-de-teste';
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    service = new UsersService(repository as unknown as UsersRepository, {} as AuditService);
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
    expect(created.role).toBe('admin');
    // a senha é gravada como hash, nunca em texto puro
    expect(created.hashPassword).not.toBe('senha-de-teste');
    await expect(bcrypt.compare('senha-de-teste', created.hashPassword)).resolves.toBe(true);
  });

  it('não cria outro administrador quando já existe usuário', async () => {
    repository.findAll.mockResolvedValue([{ id: 1, email: 'ja@existe.com' }]);

    await service.onModuleInit();

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it.each([
    { role: 'operator', active: true },
    { role: 'admin', active: false },
  ])('restaura a conta do .env como admin ativa quando está %o', async ({ role, active }) => {
    repository.findAll.mockResolvedValue([
      { id: 1, email: 'outro@empresa.com', role: 'admin', active: true },
      { id: 7, email: 'ADMIN@teste.local', role, active },
    ]);

    await service.onModuleInit();

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(7, { role: 'admin', active: true });
  });

  it('não mexe na conta do .env quando ela já é admin ativa', async () => {
    repository.findAll.mockResolvedValue([{ id: 7, email: 'admin@teste.local', role: 'admin', active: true }]);

    await service.onModuleInit();

    expect(repository.update).not.toHaveBeenCalled();
  });

  it.each(['ADM_EMAIL', 'ADM_PASSWORD'])('não sobe sem %s, mesmo com usuários no banco', async (name) => {
    delete process.env[name];
    repository.findAll.mockResolvedValue([{ id: 1, email: 'ja@existe.com' }]);

    await expect(service.onModuleInit()).rejects.toThrow(new RegExp(`${name} não configurada`));
    expect(repository.findAll).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });
});

describe('UsersService: papéis, situação e auditoria', () => {
  type StoredUser = {
    id: number;
    email: string;
    hashPassword: string;
    role: 'admin' | 'operator';
    active: boolean;
    createdAt: Date;
  };

  const createdAt = new Date('2026-11-01T00:00:00.000Z');
  const admin: StoredUser = { id: 1, email: 'admin@greenbyte.test', hashPassword: 'hash', role: 'admin', active: true, createdAt };
  const operator: StoredUser = { id: 2, email: 'operador@greenbyte.test', hashPassword: 'hash', role: 'operator', active: true, createdAt };
  const actor = { id: admin.id, email: admin.email };

  let stored: StoredUser[];
  let record: jest.Mock<(...args: unknown[]) => Promise<void>>;
  let service: UsersService;

  beforeEach(() => {
    stored = [{ ...admin }, { ...operator }];
    record = jest.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined);

    const repository = {
      findAll: async () => stored,
      findById: async (id: number) => stored.find((user) => user.id === id) ?? null,
      findByEmail: async (email: string) => stored.find((user) => user.email === email) ?? null,
      create: async (data: Partial<StoredUser>) => {
        const user = { id: 99, active: true, createdAt, role: 'operator', ...data } as StoredUser;
        stored.push(user);
        return user;
      },
      update: async (id: number, data: Partial<StoredUser>) => {
        const index = stored.findIndex((item) => item.id === id);
        if (index < 0) return null;
        // como o banco: devolve um registro novo, sem alterar o que já foi lido
        stored[index] = { ...stored[index], ...data };
        return stored[index];
      },
      delete: async (id: number) => {
        const user = stored.find((item) => item.id === id) ?? null;
        stored = stored.filter((item) => item.id !== id);
        return user;
      },
    };
    service = new UsersService(repository as unknown as UsersRepository, { record } as unknown as AuditService);
  });

  it('cria como operador quando o papel não é informado, sem devolver a senha, e audita', async () => {
    const created = await service.create({ email: 'novo@greenbyte.test', hashPassword: 'SenhaSegura123!' }, actor);

    expect(created).toMatchObject({ email: 'novo@greenbyte.test', role: 'operator', active: true });
    expect(created).not.toHaveProperty('hashPassword');
    expect(record).toHaveBeenCalledWith(actor, 'user.create', 'novo@greenbyte.test', [
      { field: 'role', from: null, to: 'operator' },
    ]);
  });

  it('altera papel e situação e registra só o que mudou', async () => {
    const updated = await service.update(operator.id, { role: 'admin', active: false }, actor);

    expect(updated).toMatchObject({ role: 'admin', active: false });
    expect(record).toHaveBeenCalledWith(actor, 'user.update', operator.email, [
      { field: 'role', from: 'operator', to: 'admin' },
      { field: 'active', from: true, to: false },
    ]);
  });

  it('registra a troca de senha sem gravar a senha na auditoria', async () => {
    await service.update(operator.id, { hashPassword: 'OutraSenha123!' }, actor);

    expect(record).toHaveBeenCalledWith(actor, 'user.update', operator.email, [
      { field: 'password', from: null, to: 'redefinida' },
    ]);
    expect(JSON.stringify(record.mock.calls)).not.toContain('OutraSenha123!');
  });

  it('não grava nem audita quando nada mudou', async () => {
    await service.update(operator.id, { role: 'operator', active: true }, actor);

    expect(record).not.toHaveBeenCalled();
  });

  it('impede o administrador de rebaixar ou desativar a própria conta', async () => {
    await expect(service.update(admin.id, { role: 'operator' }, actor)).rejects.toThrow('própria conta');
    await expect(service.update(admin.id, { active: false }, actor)).rejects.toThrow('própria conta');
    expect(stored[0]).toMatchObject({ role: 'admin', active: true });
  });

  it('impede a exclusão da própria conta', async () => {
    await expect(service.remove(admin.id, actor)).rejects.toThrow('própria conta');
    expect(stored).toHaveLength(2);
  });

  it('mantém ao menos um administrador ativo', async () => {
    // outro administrador tenta tirar o único administrador ativo restante
    stored.push({ id: 3, email: 'outro@greenbyte.test', hashPassword: 'hash', role: 'admin', active: false, createdAt });
    const otherActor = { id: 3, email: 'outro@greenbyte.test' };

    await expect(service.update(admin.id, { active: false }, otherActor)).rejects.toThrow('ao menos um administrador ativo');
    await expect(service.remove(admin.id, otherActor)).rejects.toThrow('ao menos um administrador ativo');
  });

  it('permite rebaixar um administrador quando existe outro ativo', async () => {
    stored.push({ id: 3, email: 'outro@greenbyte.test', hashPassword: 'hash', role: 'admin', active: true, createdAt });

    const updated = await service.update(3, { role: 'operator' }, actor);

    expect(updated?.role).toBe('operator');
  });

  it('exclui outro usuário e audita', async () => {
    await service.remove(operator.id, actor);

    expect(stored.map((user) => user.id)).toEqual([admin.id]);
    expect(record).toHaveBeenCalledWith(actor, 'user.delete', operator.email);
  });
});
