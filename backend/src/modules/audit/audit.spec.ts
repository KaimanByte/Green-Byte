import { jest } from '@jest/globals';
import { BadRequestException, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../../database/database.service';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditController } from './audit.controller';
import { AuditRepository } from './audit.repository';
import { AuditSanitizer, sanitizeAuditPayload } from './audit.sanitizer';
import { AuditLog } from './audit.schema';
import { AuditActor, AuditService } from './audit.service';

const actor: AuditActor = { id: 1, email: 'admin@admin.com', role: 'admin' };

const makeLog = (overrides: Partial<AuditLog> = {}): AuditLog => ({
  id: 1,
  actorId: actor.id,
  actorEmail: actor.email,
  actorRole: actor.role,
  action: 'USER_CREATED',
  targetType: 'user',
  targetId: '2',
  beforeValues: null,
  afterValues: { id: 2, email: 'op@empresa.com', role: 'operator', isActive: true },
  createdAt: new Date('2026-11-20T12:00:00.000Z'),
  ...overrides,
});

describe('AuditSanitizer', () => {
  it('remove recursivamente campos sensíveis em objetos, sub-objetos e arrays sem mutar a entrada', () => {
    const input = {
      id: 10,
      email: 'op@empresa.com',
      password: 'segredo-texto-puro',
      senha: 'outra',
      hashPassword: 'hash',
      hash_password: 'hash2',
      token: 'jwt-abc',
      secret: 's',
      authorization: 'Bearer x',
      accessToken: 'a',
      refreshToken: 'r',
      nested: {
        role: 'operator',
        access_token: 'nested-token',
        clientSecret: 'cs',
      },
      history: [
        { step: 1, passwordHash: 'ph', ok: true },
        { step: 2, refresh_token: 'rt', ok: true },
      ],
    };
    const snapshot = JSON.parse(JSON.stringify(input)) as Record<string, unknown>;

    const sanitized = sanitizeAuditPayload(input);

    expect(input).toEqual(snapshot);
    expect(sanitized).toEqual({
      id: 10,
      email: 'op@empresa.com',
      nested: { role: 'operator' },
      history: [
        { step: 1, ok: true },
        { step: 2, ok: true },
      ],
    });
  });

  it('converte Date para ISO e retorna null para null/undefined', () => {
    expect(sanitizeAuditPayload(null)).toBeNull();
    expect(sanitizeAuditPayload(undefined)).toBeNull();
    expect(sanitizeAuditPayload({ createdAt: new Date('2026-11-20T00:00:00.000Z') })).toEqual({
      createdAt: '2026-11-20T00:00:00.000Z',
    });
  });
});

describe('AuditRepository', () => {
  it('insere e consulta ordenado do mais recente para o mais antigo com filtros e paginação', async () => {
    const created = makeLog();
    const returning = jest.fn<() => Promise<AuditLog[]>>().mockResolvedValue([created]);
    const values = jest.fn<() => { returning: typeof returning }>().mockReturnValue({ returning });

    const offset = jest.fn<() => Promise<AuditLog[]>>().mockResolvedValue([created]);
    const limit = jest.fn<() => { offset: typeof offset }>().mockReturnValue({ offset });
    const orderBy = jest.fn<() => { limit: typeof limit }>().mockReturnValue({ limit });
    const where = jest.fn<() => { orderBy: typeof orderBy }>().mockReturnValue({ orderBy });

    const db = {
      insert: () => ({ values }),
      select: () => ({ from: () => ({ where }) }),
    };
    const repository = new AuditRepository({ db } as unknown as DatabaseService);

    await expect(
      repository.create({
        actorId: 1,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'USER_CREATED',
        targetType: 'user',
        targetId: '2',
        beforeValues: null,
        afterValues: { email: 'op@empresa.com' },
      }),
    ).resolves.toEqual(created);

    const rows = await repository.findAll({
      action: 'USER_CREATED',
      actorId: 1,
      targetType: 'user',
      targetId: '2',
      from: new Date('2026-11-01T00:00:00.000Z'),
      to: new Date('2026-11-30T23:59:59.000Z'),
      limit: 20,
      offset: 10,
    });

    expect(where).toHaveBeenCalledTimes(1);
    expect(orderBy).toHaveBeenCalledTimes(1);
    expect(limit).toHaveBeenCalledWith(20);
    expect(offset).toHaveBeenCalledWith(10);
    expect(rows).toEqual([created]);
  });
});

describe('AuditService', () => {
  let create: jest.Mock<AuditRepository['create']>;
  let findAll: jest.Mock<AuditRepository['findAll']>;
  let service: AuditService;

  beforeEach(() => {
    create = jest.fn<AuditRepository['create']>(async (data) =>
      makeLog({
        ...data,
        beforeValues: data.beforeValues ?? null,
        afterValues: data.afterValues ?? null,
      }),
    );
    findAll = jest.fn<AuditRepository['findAll']>().mockResolvedValue([makeLog()]);
    service = new AuditService(
      { create, findAll } as unknown as AuditRepository,
      new AuditSanitizer(),
    );
  });

  it('sanitiza dados sensíveis ao registrar alterações de usuários e configurações', async () => {
    await service.recordUserCreated(actor, 2, {
      id: 2,
      email: 'op@empresa.com',
      password: '123',
      hashPassword: 'hash',
      role: 'operator',
    });

    expect(create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        actorId: 1,
        action: 'USER_CREATED',
        targetType: 'user',
        targetId: '2',
        beforeValues: null,
        afterValues: { id: 2, email: 'op@empresa.com', role: 'operator' },
      }),
    );

    await service.recordMonitoringConfigUpdated(
      actor,
      1,
      { collectionIntervalSeconds: 30, secret: 'x' },
      { collectionIntervalSeconds: 60, token: 'y' },
    );
    expect(create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'MONITORING_CONFIG_UPDATED',
        targetType: 'monitoring_config',
        targetId: '1',
        beforeValues: { collectionIntervalSeconds: 30 },
        afterValues: { collectionIntervalSeconds: 60 },
      }),
    );

    await service.recordEnergyModelUpdated(
      actor,
      1,
      { cpuMaxWatts: 100 },
      { cpuMaxWatts: 150, authorization: 'Bearer abc' },
    );
    expect(create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'ENERGY_MODEL_UPDATED',
        targetType: 'energy_model',
        targetId: '1',
        beforeValues: { cpuMaxWatts: 100 },
        afterValues: { cpuMaxWatts: 150 },
      }),
    );
  });

  it('consulta logs com filtros válidos e paginação padrão', async () => {
    await service.findAll();
    expect(findAll).toHaveBeenLastCalledWith({
      action: undefined,
      actorId: undefined,
      targetType: undefined,
      targetId: undefined,
      from: undefined,
      to: undefined,
      limit: 50,
      offset: 0,
    });

    await service.findAll({
      action: 'USER_UPDATED',
      actorId: '1',
      targetType: 'user',
      targetId: ' 2 ',
      from: '2026-11-01T00:00:00Z',
      to: '2026-11-30T00:00:00Z',
      limit: '10',
      offset: '5',
    });

    expect(findAll).toHaveBeenLastCalledWith({
      action: 'USER_UPDATED',
      actorId: 1,
      targetType: 'user',
      targetId: '2',
      from: new Date('2026-11-01T00:00:00.000Z'),
      to: new Date('2026-11-30T00:00:00.000Z'),
      limit: 10,
      offset: 5,
    });
  });

  it('rejeita filtros inválidos com 400 BadRequestException', async () => {
    await expect(service.findAll({ action: 'INVALID' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.findAll({ targetType: 'invalid' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.findAll({ actorId: '0' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.findAll({ actorId: 'abc' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.findAll({ from: 'data-invalida' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.findAll({ from: '2026-11-10T00:00:00Z', to: '2026-11-01T00:00:00Z' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.findAll({ limit: '0' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.findAll({ limit: '501' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.findAll({ offset: '-1' })).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('AuditController & RBAC', () => {
  const findAll = jest.fn<AuditService['findAll']>().mockResolvedValue([makeLog()]);
  const controller = new AuditController({ findAll } as unknown as AuditService);
  const guard = new RolesGuard(new Reflector());

  const contextWithUser = (user?: AuthenticatedUser): ExecutionContext =>
    ({
      getHandler: () => AuditController.prototype.findAll,
      getClass: () => AuditController,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  it('protege GET /audit-logs exclusivamente para papel admin', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AuditController)).toEqual([JwtAuthGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, AuditController)).toEqual(['admin']);

    const admin: AuthenticatedUser = {
      id: 1,
      email: 'admin@admin.com',
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
    };
    const operator: AuthenticatedUser = { ...admin, id: 2, email: 'op@admin.com', role: 'operator' };

    expect(guard.canActivate(contextWithUser(admin))).toBe(true);
    expect(() => guard.canActivate(contextWithUser(operator))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(contextWithUser({ ...admin, isActive: false }))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(contextWithUser(undefined))).toThrow(UnauthorizedException);
  });

  it('repassa query params ao AuditService e devolve o histórico', async () => {
    const result = await controller.findAll('USER_CREATED', '1', 'user', '2', undefined, undefined, '25', '0');

    expect(findAll).toHaveBeenCalledWith({
      action: 'USER_CREATED',
      actorId: '1',
      targetType: 'user',
      targetId: '2',
      from: undefined,
      to: undefined,
      limit: '25',
      offset: '0',
    });
    expect(result).toHaveLength(1);
  });
});
