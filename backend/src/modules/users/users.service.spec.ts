import { jest } from '@jest/globals';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../../database/database.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserLifecyclePolicy } from './user-lifecycle.policy';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { NewUser, User } from './users.schema';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'admin@greenbyte.test',
  hashPassword: 'hash-secreto',
  role: 'admin',
  isActive: true,
  createdAt: new Date('2026-11-01T00:00:00.000Z'),
  ...overrides,
});

type RepoMock = {
  findAll: jest.Mock<UsersRepository['findAll']>;
  findById: jest.Mock<UsersRepository['findById']>;
  findByEmail: jest.Mock<UsersRepository['findByEmail']>;
  countActiveAdmins: jest.Mock<UsersRepository['countActiveAdmins']>;
  create: jest.Mock<UsersRepository['create']>;
  update: jest.Mock<UsersRepository['update']>;
  delete: jest.Mock<UsersRepository['delete']>;
};

function createRepo(): RepoMock {
  return {
    findAll: jest.fn<UsersRepository['findAll']>().mockResolvedValue([]),
    findById: jest.fn<UsersRepository['findById']>().mockResolvedValue(null),
    findByEmail: jest.fn<UsersRepository['findByEmail']>().mockResolvedValue(null),
    countActiveAdmins: jest.fn<UsersRepository['countActiveAdmins']>().mockResolvedValue(2),
    create: jest.fn<UsersRepository['create']>(async (data: NewUser) =>
      makeUser({ id: 10, ...data, role: data.role ?? 'operator', isActive: data.isActive ?? true }),
    ),
    update: jest.fn<UsersRepository['update']>(),
    delete: jest.fn<UsersRepository['delete']>(),
  };
}

const ADMIN_ACTOR = { id: 1, email: 'admin@greenbyte.test', role: 'admin' as const };

type AuditMock = {
  recordUserCreated: jest.Mock<AuditService['recordUserCreated']>;
  recordUserUpdated: jest.Mock<AuditService['recordUserUpdated']>;
  recordUserStatusChanged: jest.Mock<AuditService['recordUserStatusChanged']>;
  recordUserDeleted: jest.Mock<AuditService['recordUserDeleted']>;
};

function createAuditMock(): AuditMock {
  return {
    recordUserCreated: jest.fn<AuditService['recordUserCreated']>(),
    recordUserUpdated: jest.fn<AuditService['recordUserUpdated']>(),
    recordUserStatusChanged: jest.fn<AuditService['recordUserStatusChanged']>(),
    recordUserDeleted: jest.fn<AuditService['recordUserDeleted']>(),
  };
}

describe('UsersService: administrador inicial (seed)', () => {
  let repo: RepoMock;
  let service: UsersService;

  beforeEach(() => {
    repo = createRepo();
    process.env.ADM_EMAIL = 'admin@admin.com';
    process.env.ADM_PASSWORD = 'senha-de-teste';
    service = new UsersService(repo as unknown as UsersRepository, new UserLifecyclePolicy());
  });

  afterEach(() => {
    delete process.env.ADM_EMAIL;
    delete process.env.ADM_PASSWORD;
  });

  it('cria o admin do .env com papel admin, conta ativa e senha só em hash', async () => {
    await service.onModuleInit();

    expect(repo.create).toHaveBeenCalledTimes(1);
    const created = repo.create.mock.calls[0][0];
    expect(created).toMatchObject({ email: 'admin@admin.com', role: 'admin', isActive: true });
    expect(created.hashPassword).not.toBe('senha-de-teste');
    await expect(bcrypt.compare('senha-de-teste', created.hashPassword)).resolves.toBe(true);
  });

  it('promove e reativa o admin do .env quando ele já existe como operator/desativado', async () => {
    repo.findByEmail.mockResolvedValue(makeUser({ id: 4, email: 'admin@admin.com', role: 'operator', isActive: false }));

    await service.onModuleInit();

    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith(4, { role: 'admin', isActive: true });
  });

  it('não altera nada quando o admin do .env já está correto', async () => {
    repo.findByEmail.mockResolvedValue(makeUser({ email: 'admin@admin.com' }));

    await service.onModuleInit();

    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it.each(['ADM_EMAIL', 'ADM_PASSWORD'])('não sobe sem %s', async (name) => {
    delete process.env[name];

    await expect(service.onModuleInit()).rejects.toThrow(new RegExp(`${name} não configurada`));
    expect(repo.findByEmail).not.toHaveBeenCalled();
  });
});

describe('UsersService: CRUD e ciclo de vida', () => {
  let repo: RepoMock;
  let audit: AuditMock;
  let service: UsersService;

  beforeEach(() => {
    repo = createRepo();
    audit = createAuditMock();
    service = new UsersService(
      repo as unknown as UsersRepository,
      new UserLifecyclePolicy(),
      audit as unknown as AuditService,
    );
  });

  describe('create', () => {
    it('cria operator por padrão, ativo, registra auditoria e nunca devolve o hash', async () => {
      const result = await service.create(
        { email: 'op@greenbyte.test', hashPassword: 'SenhaSegura123!' },
        ADMIN_ACTOR,
      );

      const saved = repo.create.mock.calls[0][0];
      expect(saved.role).toBe('operator');
      expect(saved.isActive).toBe(true);
      await expect(bcrypt.compare('SenhaSegura123!', saved.hashPassword)).resolves.toBe(true);
      expect(result).not.toHaveProperty('hashPassword');
      expect(result).toMatchObject({ email: 'op@greenbyte.test', role: 'operator', isActive: true });
      expect(audit.recordUserCreated).toHaveBeenCalledWith(ADMIN_ACTOR, result.id, result);
    });

    it('aceita criar admin e conta inativa', async () => {
      const result = await service.create({
        email: 'a2@greenbyte.test',
        hashPassword: 'SenhaSegura123!',
        role: 'admin',
        isActive: false,
      });

      expect(result).toMatchObject({ role: 'admin', isActive: false });
    });

    it('rejeita papel inválido com 400', async () => {
      const dto = {
        email: 'x@greenbyte.test',
        hashPassword: 'SenhaSegura123!',
        role: 'superuser',
      } as unknown as CreateUserDto;

      await expect(service.create(dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejeita e-mail duplicado com 409', async () => {
      repo.findByEmail.mockResolvedValue(makeUser());

      await expect(
        service.create({ email: 'admin@greenbyte.test', hashPassword: 'SenhaSegura123!' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('consultas', () => {
    it('lista e consulta sem expor hash', async () => {
      repo.findAll.mockResolvedValue([makeUser(), makeUser({ id: 2, role: 'operator' })]);
      repo.findById.mockResolvedValue(makeUser());
      repo.findByEmail.mockResolvedValue(makeUser());

      const list = await service.findAll();
      expect(list).toHaveLength(2);
      list.forEach((u) => expect(u).not.toHaveProperty('hashPassword'));
      await expect(service.findById(1)).resolves.not.toHaveProperty('hashPassword');
      await expect(service.findByEmail('admin@greenbyte.test')).resolves.toMatchObject({ id: 1 });
    });

    it('404 para usuário inexistente', async () => {
      await expect(service.findById(99)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.findByEmail('nao@existe.com')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('edita e-mail, senha e papel de outro usuário', async () => {
      repo.findById.mockResolvedValue(makeUser({ id: 2, email: 'op@greenbyte.test', role: 'operator' }));
      repo.update.mockResolvedValue(makeUser({ id: 2, email: 'novo@greenbyte.test', role: 'admin' }));

      const result = await service.update(
        2,
        { email: 'novo@greenbyte.test', hashPassword: 'NovaSenha123!', role: 'admin' },
        ADMIN_ACTOR,
      );

      const changes = repo.update.mock.calls[0][1];
      expect(changes).toMatchObject({ email: 'novo@greenbyte.test', role: 'admin' });
      await expect(bcrypt.compare('NovaSenha123!', changes.hashPassword ?? '')).resolves.toBe(true);
      expect(result).toMatchObject({ role: 'admin' });
      expect(result).not.toHaveProperty('hashPassword');
      expect(audit.recordUserUpdated).toHaveBeenCalledWith(
        ADMIN_ACTOR,
        2,
        expect.objectContaining({ id: 2, email: 'op@greenbyte.test', role: 'operator' }),
        result,
      );
    });

    it('permite alterar isActive via update respeitando a política de ciclo de vida', async () => {
      repo.findById.mockResolvedValueOnce(makeUser({ id: 2, role: 'operator' }));
      repo.update.mockResolvedValueOnce(makeUser({ id: 2, role: 'operator', isActive: false }));

      const updated = await service.update(2, { isActive: false }, ADMIN_ACTOR);
      expect(updated).toMatchObject({ isActive: false });
      expect(repo.update).toHaveBeenCalledWith(2, { isActive: false });
      expect(audit.recordUserStatusChanged).toHaveBeenCalledWith(
        ADMIN_ACTOR,
        2,
        expect.objectContaining({ isActive: true }),
        updated,
      );

      repo.findById.mockResolvedValueOnce(makeUser({ id: 1 }));
      await expect(service.update(1, { isActive: false }, ADMIN_ACTOR)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejeita papel inválido com 400', async () => {
      repo.findById.mockResolvedValue(makeUser({ id: 2, role: 'operator' }));

      await expect(
        service.update(2, { role: 'root' } as unknown as { role: 'admin' }, ADMIN_ACTOR),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('impede o admin de rebaixar a própria conta (403)', async () => {
      repo.findById.mockResolvedValue(makeUser({ id: 1 }));

      await expect(service.update(1, { role: 'operator' }, ADMIN_ACTOR)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('impede rebaixar o último admin ativo (400)', async () => {
      repo.findById.mockResolvedValue(makeUser({ id: 5 }));
      repo.countActiveAdmins.mockResolvedValue(1);

      await expect(service.update(5, { role: 'operator' }, ADMIN_ACTOR)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita e-mail já usado por outro usuário (409)', async () => {
      repo.findById.mockResolvedValue(makeUser({ id: 2, role: 'operator' }));
      repo.findByEmail.mockResolvedValue(makeUser({ id: 3, email: 'outro@greenbyte.test' }));

      await expect(service.update(2, { email: 'outro@greenbyte.test' }, ADMIN_ACTOR)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('sem mudanças efetivas não grava nada', async () => {
      repo.findById.mockResolvedValue(makeUser({ id: 2, role: 'operator' }));

      await service.update(2, { role: 'operator' }, ADMIN_ACTOR);

      expect(repo.update).not.toHaveBeenCalled();
    });

    it('404 para usuário inexistente', async () => {
      await expect(service.update(99, { role: 'admin' }, ADMIN_ACTOR)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('setActive (ativar/desativar)', () => {
    it('desativa e reativa outro usuário', async () => {
      repo.findById.mockResolvedValueOnce(makeUser({ id: 2, role: 'operator' }));
      repo.update.mockResolvedValueOnce(makeUser({ id: 2, role: 'operator', isActive: false }));

      await expect(service.setActive(2, false, ADMIN_ACTOR)).resolves.toMatchObject({ isActive: false });
      expect(repo.update).toHaveBeenLastCalledWith(2, { isActive: false });
      expect(audit.recordUserStatusChanged).toHaveBeenCalledTimes(1);

      repo.findById.mockResolvedValueOnce(makeUser({ id: 2, role: 'operator', isActive: false }));
      repo.update.mockResolvedValueOnce(makeUser({ id: 2, role: 'operator', isActive: true }));

      await expect(service.setActive(2, true, ADMIN_ACTOR)).resolves.toMatchObject({ isActive: true });
      expect(repo.update).toHaveBeenLastCalledWith(2, { isActive: true });
    });

    it('bloqueia auto-desativação (403)', async () => {
      repo.findById.mockResolvedValue(makeUser({ id: 1 }));

      await expect(service.setActive(1, false, ADMIN_ACTOR)).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('bloqueia desativar o último admin ativo (400)', async () => {
      repo.findById.mockResolvedValue(makeUser({ id: 7 }));
      repo.countActiveAdmins.mockResolvedValue(1);

      await expect(service.setActive(7, false, ADMIN_ACTOR)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('não grava nada nem audita quando o estado já é o desejado (no-op)', async () => {
      repo.findById.mockResolvedValueOnce(makeUser({ id: 2, role: 'operator', isActive: true }));

      await expect(service.setActive(2, true, ADMIN_ACTOR)).resolves.toMatchObject({ id: 2, isActive: true });
      expect(repo.update).not.toHaveBeenCalled();
      expect(audit.recordUserStatusChanged).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('remove outro usuário e não devolve hash', async () => {
      const target = makeUser({ id: 2, role: 'operator' });
      repo.findById.mockResolvedValue(target);
      repo.delete.mockResolvedValue(target);

      const result = await service.remove(2, ADMIN_ACTOR);

      expect(repo.delete).toHaveBeenCalledWith(2);
      expect(result).not.toHaveProperty('hashPassword');
      expect(audit.recordUserDeleted).toHaveBeenCalledWith(ADMIN_ACTOR, 2, result);
    });

    it('bloqueia auto-remoção (403)', async () => {
      repo.findById.mockResolvedValue(makeUser({ id: 1 }));

      await expect(service.remove(1, ADMIN_ACTOR)).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('bloqueia remover o último admin ativo (400)', async () => {
      repo.findById.mockResolvedValue(makeUser({ id: 8 }));
      repo.countActiveAdmins.mockResolvedValue(1);

      await expect(service.remove(8, ADMIN_ACTOR)).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('404 para usuário inexistente ou quando update/delete retornam null', async () => {
      await expect(service.remove(99, ADMIN_ACTOR)).rejects.toBeInstanceOf(NotFoundException);

      repo.findById.mockResolvedValueOnce(makeUser({ id: 2, role: 'operator' }));
      repo.delete.mockResolvedValueOnce(null);
      await expect(service.remove(2, ADMIN_ACTOR)).rejects.toBeInstanceOf(NotFoundException);

      repo.findById.mockResolvedValueOnce(makeUser({ id: 2, role: 'operator' }));
      repo.update.mockResolvedValueOnce(null);
      await expect(service.update(2, { role: 'admin' }, ADMIN_ACTOR)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

describe('UsersRepository', () => {
  it('executa consultas, contagem de admins ativos, criação, atualização e remoção', async () => {
    const sample = makeUser();
    const orderBy = jest.fn<() => Promise<User[]>>().mockResolvedValue([sample]);
    const selectWhere = jest
      .fn<() => Promise<unknown[]>>()
      .mockResolvedValueOnce([sample])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([sample])
      .mockResolvedValueOnce([{ total: 2 }])
      .mockResolvedValueOnce([]);
    const insertReturning = jest.fn<() => Promise<User[]>>().mockResolvedValue([sample]);
    const updateReturning = jest.fn<() => Promise<User[]>>().mockResolvedValueOnce([sample]).mockResolvedValueOnce([]);
    const deleteReturning = jest.fn<() => Promise<User[]>>().mockResolvedValueOnce([sample]).mockResolvedValueOnce([]);

    const db = {
      select: () => ({ from: () => ({ orderBy, where: selectWhere }) }),
      insert: () => ({ values: () => ({ returning: insertReturning }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: updateReturning }) }) }),
      delete: () => ({ where: () => ({ returning: deleteReturning }) }),
    };
    const repository = new UsersRepository({ db } as unknown as DatabaseService);

    await expect(repository.findAll()).resolves.toEqual([sample]);
    await expect(repository.findById(1)).resolves.toEqual(sample);
    await expect(repository.findById(99)).resolves.toBeNull();
    await expect(repository.findByEmail(sample.email)).resolves.toEqual(sample);
    await expect(repository.countActiveAdmins()).resolves.toBe(2);
    await expect(repository.countActiveAdmins()).resolves.toBe(0);
    await expect(repository.create({ email: sample.email, hashPassword: sample.hashPassword })).resolves.toEqual(sample);
    await expect(repository.update(1, { role: 'operator' })).resolves.toEqual(sample);
    await expect(repository.update(99, { role: 'operator' })).resolves.toBeNull();
    await expect(repository.delete(1)).resolves.toEqual(sample);
    await expect(repository.delete(99)).resolves.toBeNull();
  });
});
