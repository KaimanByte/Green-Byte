import { jest } from '@jest/globals';
import { BadRequestException, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../../database/database.service';
import { CollectionHealthSnapshot, StartupSyncService } from '../../startup-sync.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { resolveRecommendedPollSeconds } from './polling-interval';
import { SettingsController } from './settings.controller';
import { SettingsRepository } from './settings.repository';
import { Settings } from './settings.schema';
import { SettingsService } from './settings.service';

const adminActor: AuthenticatedUser = {
  id: 1,
  email: 'admin@admin.com',
  role: 'admin',
  isActive: true,
  createdAt: new Date('2026-11-20T00:00:00.000Z'),
};

const makeHealth = (intervalSeconds: number): CollectionHealthSnapshot => ({
  status: 'success',
  isRunning: false,
  effectiveIntervalSeconds: intervalSeconds,
  effectiveIntervalMs: intervalSeconds * 1_000,
  recommendedPollSeconds: resolveRecommendedPollSeconds(intervalSeconds),
  recommendedPollMs: resolveRecommendedPollSeconds(intervalSeconds) * 1_000,
  nextRunAt: '2026-11-20T20:01:00.000Z',
  lastRunAt: '2026-11-20T20:00:00.000Z',
  lastFinishedAt: '2026-11-20T20:00:00.500Z',
  lastDurationMs: 500,
  recordsSaved: 5,
  errorStage: null,
  errorMessage: null,
  lastCycle: {
    trigger: 'periódico',
    status: 'success',
    startedAt: '2026-11-20T20:00:00.000Z',
    finishedAt: '2026-11-20T20:00:00.500Z',
    durationMs: 500,
    recordsSaved: 5,
    errorStage: null,
    errorMessage: null,
  },
});

describe('resolveRecommendedPollSeconds (regra de teto 60s)', () => {
  it('mantém intervalos <= 60s e limita intervalos > 60s a 60s', () => {
    expect(resolveRecommendedPollSeconds(15)).toBe(15);
    expect(resolveRecommendedPollSeconds(60)).toBe(60);
    expect(resolveRecommendedPollSeconds(180)).toBe(60);
  });

  it('usa fallback seguro para valores ausentes ou inválidos', () => {
    expect(resolveRecommendedPollSeconds(undefined)).toBe(30);
    expect(resolveRecommendedPollSeconds(null)).toBe(30);
    expect(resolveRecommendedPollSeconds(0)).toBe(30);
    expect(resolveRecommendedPollSeconds(-10)).toBe(30);
    expect(resolveRecommendedPollSeconds(Number.NaN, 45)).toBe(45);
    expect(resolveRecommendedPollSeconds(Number.NaN, 120)).toBe(60);
    expect(resolveRecommendedPollSeconds(undefined, -1)).toBe(30);
    expect(resolveRecommendedPollSeconds(undefined, Number.NaN)).toBe(30);
  });
});

describe('SettingsService', () => {
  let getSettings: jest.Mock<SettingsRepository['getSettings']>;
  let updateSettings: jest.Mock<SettingsRepository['updateSettings']>;
  let getHealthStatus: jest.Mock<StartupSyncService['getHealthStatus']>;
  let getEffectiveIntervalSeconds: jest.Mock<StartupSyncService['getEffectiveIntervalSeconds']>;
  let reschedulePeriodicSync: jest.Mock<StartupSyncService['reschedulePeriodicSync']>;
  let recordMonitoringConfigUpdated: jest.Mock<AuditService['recordMonitoringConfigUpdated']>;
  let service: SettingsService;

  const baseSettings: Settings = {
    id: 1,
    collectionIntervalSeconds: 30,
    cpuMaxWatts: 150,
    ramWattsPerGb: 3,
    diskWattsPerGb: 1,
    updatedAt: new Date('2026-11-20T19:00:00.000Z'),
  };

  beforeEach(() => {
    getSettings = jest.fn<SettingsRepository['getSettings']>().mockResolvedValue(baseSettings);
    updateSettings = jest.fn<SettingsRepository['updateSettings']>().mockImplementation(async (data) => ({
      ...baseSettings,
      ...data,
    }));
    getHealthStatus = jest.fn<StartupSyncService['getHealthStatus']>().mockReturnValue(makeHealth(30));
    getEffectiveIntervalSeconds = jest.fn<StartupSyncService['getEffectiveIntervalSeconds']>().mockReturnValue(30);
    reschedulePeriodicSync = jest
      .fn<StartupSyncService['reschedulePeriodicSync']>()
      .mockImplementation((seconds: number) => makeHealth(seconds));
    recordMonitoringConfigUpdated = jest.fn<AuditService['recordMonitoringConfigUpdated']>();

    service = new SettingsService(
      { getSettings, updateSettings } as unknown as SettingsRepository,
      {
        getHealthStatus,
        getEffectiveIntervalSeconds,
        reschedulePeriodicSync,
      } as unknown as StartupSyncService,
      { recordMonitoringConfigUpdated } as unknown as AuditService,
    );
  });

  it('retorna a saúde operacional atual da coleta', async () => {
    const health = await service.getCollectionHealth();
    expect(health.effectiveIntervalSeconds).toBe(30);
    expect(health.recommendedPollSeconds).toBe(30);
    expect(health.status).toBe('success');
  });

  it('persiste o novo intervalo, reagenda sem restart e registra auditoria', async () => {
    const health = await service.updateCollectionInterval(120, adminActor);

    expect(updateSettings).toHaveBeenCalledWith({ collectionIntervalSeconds: 120 });
    expect(reschedulePeriodicSync).toHaveBeenCalledWith(120);
    expect(recordMonitoringConfigUpdated).toHaveBeenCalledWith(
      adminActor,
      1,
      { collectionIntervalSeconds: 30 },
      { collectionIntervalSeconds: 120 },
    );
    expect(health.effectiveIntervalSeconds).toBe(120);
    expect(health.recommendedPollSeconds).toBe(60);
  });

  it('rejeita intervalos fora da faixa segura com 400 BadRequestException', async () => {
    for (const invalid of [0, -5, 86_401, 15.5, Number.NaN]) {
      await expect(service.updateCollectionInterval(invalid, adminActor)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    }
    expect(updateSettings).not.toHaveBeenCalled();
    expect(reschedulePeriodicSync).not.toHaveBeenCalled();
    expect(recordMonitoringConfigUpdated).not.toHaveBeenCalled();
  });

  it('usa intervalo efetivo do StartupSyncService quando getSettings não traz valor e propaga falha de persistência', async () => {
    getSettings.mockResolvedValueOnce(undefined as unknown as Settings);
    await service.updateCollectionInterval(50, adminActor);
    expect(recordMonitoringConfigUpdated).toHaveBeenCalledWith(
      adminActor,
      1,
      { collectionIntervalSeconds: 30 },
      { collectionIntervalSeconds: 50 },
    );

    updateSettings.mockRejectedValueOnce(new Error('Erro ao gravar settings'));
    await expect(service.updateCollectionInterval(40, adminActor)).rejects.toThrow('Erro ao gravar settings');
    expect(reschedulePeriodicSync).toHaveBeenCalledTimes(1);
  });
});

describe('SettingsRepository', () => {
  const row: Settings = {
    id: 1,
    collectionIntervalSeconds: 60,
    cpuMaxWatts: 150,
    ramWattsPerGb: 3,
    diskWattsPerGb: 1,
    updatedAt: new Date('2026-11-20T00:00:00.000Z'),
  };

  it('retorna registro existente ou cria inicial em getSettings; atualiza ou insere em updateSettings', async () => {
    const selectWhere = jest.fn<() => Promise<Settings[]>>().mockResolvedValueOnce([row]).mockResolvedValueOnce([]);
    const insertReturning = jest.fn<() => Promise<Settings[]>>().mockResolvedValue([row]);
    const insertValues = jest.fn<() => { returning: typeof insertReturning }>().mockReturnValue({
      returning: insertReturning,
    });
    const updateReturning = jest.fn<() => Promise<Settings[]>>().mockResolvedValueOnce([row]).mockResolvedValueOnce([]);
    const updateWhere = jest.fn<() => { returning: typeof updateReturning }>().mockReturnValue({
      returning: updateReturning,
    });
    const updateSet = jest.fn<() => { where: typeof updateWhere }>().mockReturnValue({ where: updateWhere });

    const db = {
      select: () => ({ from: () => ({ where: selectWhere }) }),
      insert: () => ({ values: insertValues }),
      update: () => ({ set: updateSet }),
    };
    const repository = new SettingsRepository({ db } as unknown as DatabaseService);

    await expect(repository.getSettings()).resolves.toEqual(row);
    expect(insertValues).not.toHaveBeenCalled();

    await expect(repository.getSettings()).resolves.toEqual(row);
    expect(insertValues).toHaveBeenCalledWith({ id: 1 });

    await expect(repository.updateSettings({ collectionIntervalSeconds: 60 })).resolves.toEqual(row);
    await expect(repository.updateSettings({ collectionIntervalSeconds: 90 })).resolves.toEqual(row);
    expect(insertValues).toHaveBeenLastCalledWith({ id: 1, collectionIntervalSeconds: 90 });
  });
});

describe('SettingsController & RBAC', () => {
  const getCollectionHealth = jest.fn<SettingsService['getCollectionHealth']>().mockResolvedValue(makeHealth(30));
  const updateCollectionInterval = jest
    .fn<SettingsService['updateCollectionInterval']>()
    .mockResolvedValue(makeHealth(45));
  const controller = new SettingsController({
    getCollectionHealth,
    updateCollectionInterval,
  } as unknown as SettingsService);
  const guard = new RolesGuard(new Reflector());

  const contextWith = (
    handler: (...args: never[]) => unknown,
    user?: AuthenticatedUser,
  ): ExecutionContext =>
    ({
      getHandler: () => handler,
      getClass: () => SettingsController,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  it('exige admin apenas na rota de alteração; leitura de saúde permanece acessível ao dashboard', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, SettingsController.prototype.updateCollectionInterval),
    ).toEqual([JwtAuthGuard, RolesGuard]);
    expect(
      Reflect.getMetadata(ROLES_KEY, SettingsController.prototype.updateCollectionInterval),
    ).toEqual(['admin']);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, SettingsController.prototype.getCollectionHealth),
    ).toBeUndefined();

    const operator: AuthenticatedUser = { ...adminActor, id: 2, email: 'op@admin.com', role: 'operator' };

    expect(guard.canActivate(contextWith(SettingsController.prototype.updateCollectionInterval, adminActor))).toBe(
      true,
    );
    expect(() =>
      guard.canActivate(contextWith(SettingsController.prototype.updateCollectionInterval, operator)),
    ).toThrow(ForbiddenException);
    expect(() =>
      guard.canActivate(contextWith(SettingsController.prototype.updateCollectionInterval, undefined)),
    ).toThrow(UnauthorizedException);
  });

  it('delega consultas e alterações ao SettingsService', async () => {
    await expect(controller.getCollectionHealth()).resolves.toMatchObject({ effectiveIntervalSeconds: 30 });
    await expect(
      controller.updateCollectionInterval({ collectionIntervalSeconds: 45 }, adminActor),
    ).resolves.toMatchObject({ effectiveIntervalSeconds: 45 });
    expect(updateCollectionInterval).toHaveBeenCalledWith(45, adminActor);
  });
});
