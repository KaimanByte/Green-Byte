import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import type { SchedulerRegistry } from '@nestjs/schedule';
import type { CollectionsService } from './modules/collections/collections.service';
import type { RegionsService } from './modules/regions/regions.service';
import type { ServicesService } from './modules/services/services.service';
import type { SettingsRepository } from './modules/settings/settings.repository';
import { StartupSyncService } from './startup-sync.service';

type AsyncVoidFn = () => Promise<void>;
type SyncCollectionsFn = () => Promise<{ total: number; collections: unknown[] } | undefined>;

type SchedulerRegistryMock = {
  addInterval: jest.Mock<(name: string, interval: NodeJS.Timeout) => void>;
  deleteInterval: jest.Mock<(name: string) => void>;
};

describe('StartupSyncService', () => {
  let service: StartupSyncService;
  let regionsService: { syncRegions: jest.Mock<AsyncVoidFn> };
  let servicesService: { syncServices: jest.Mock<AsyncVoidFn> };
  let collectionsService: { syncCollections: jest.Mock<SyncCollectionsFn> };
  let schedulerRegistry: SchedulerRegistryMock;
  let settingsRepository: { getSettings: jest.Mock<() => Promise<{ collectionIntervalSeconds: number }>> };
  const originalInterval = process.env.COLLECTION_INTERVAL_SECONDS;

  beforeEach(() => {
    jest.useFakeTimers();
    delete process.env.COLLECTION_INTERVAL_SECONDS;

    regionsService = { syncRegions: jest.fn<AsyncVoidFn>() };
    servicesService = { syncServices: jest.fn<AsyncVoidFn>() };
    collectionsService = {
      syncCollections: jest.fn<SyncCollectionsFn>().mockResolvedValue({ total: 3, collections: [] }),
    };
    schedulerRegistry = {
      addInterval: jest.fn<(name: string, interval: NodeJS.Timeout) => void>(),
      deleteInterval: jest.fn<(name: string) => void>(),
    };
    settingsRepository = {
      getSettings: jest.fn<() => Promise<{ collectionIntervalSeconds: number }>>().mockResolvedValue({
        collectionIntervalSeconds: 30,
      }),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    if (originalInterval === undefined) {
      delete process.env.COLLECTION_INTERVAL_SECONDS;
    } else {
      process.env.COLLECTION_INTERVAL_SECONDS = originalInterval;
    }
    jest.clearAllMocks();
  });

  function createService(withSettingsRepo = false): StartupSyncService {
    return new StartupSyncService(
      regionsService as unknown as RegionsService,
      servicesService as unknown as ServicesService,
      collectionsService as unknown as CollectionsService,
      schedulerRegistry as unknown as SchedulerRegistry,
      withSettingsRepo ? (settingsRepository as unknown as SettingsRepository) : undefined,
    );
  }

  it('executa a sincronização inicial e registra o intervalo padrão de 30 segundos', async () => {
    service = createService();

    expect(service.getHealthStatus().status).toBe('no_data');

    await service.onApplicationBootstrap();

    expect(regionsService.syncRegions).toHaveBeenCalledTimes(1);
    expect(servicesService.syncServices).toHaveBeenCalledTimes(1);
    expect(collectionsService.syncCollections).toHaveBeenCalledTimes(1);
    expect(schedulerRegistry.addInterval).toHaveBeenCalledTimes(1);
    expect(schedulerRegistry.addInterval).toHaveBeenCalledWith(
      'green-byte-periodic-sync',
      expect.anything(),
    );

    const health = service.getHealthStatus();
    expect(health.status).toBe('success');
    expect(health.isRunning).toBe(false);
    expect(health.recordsSaved).toBe(3);
    expect(health.effectiveIntervalSeconds).toBe(30);
    expect(health.recommendedPollSeconds).toBe(30);
    expect(health.nextRunAt).not.toBeNull();
    expect(health.lastDurationMs).toBeGreaterThanOrEqual(0);
    expect(health.errorStage).toBeNull();
    expect(health.errorMessage).toBeNull();
  });

  it('utiliza o intervalo definido em COLLECTION_INTERVAL_SECONDS e aplica teto de 60s ao polling', async () => {
    process.env.COLLECTION_INTERVAL_SECONDS = '120';
    service = createService();

    await service.onApplicationBootstrap();
    expect(service.getHealthStatus().effectiveIntervalSeconds).toBe(120);
    expect(service.getHealthStatus().recommendedPollSeconds).toBe(60);

    await jest.advanceTimersByTimeAsync(119_999);
    expect(regionsService.syncRegions).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(regionsService.syncRegions).toHaveBeenCalledTimes(2);
  });

  it('carrega o intervalo persistido no banco quando COLLECTION_INTERVAL_SECONDS não foi definido', async () => {
    settingsRepository.getSettings.mockResolvedValue({ collectionIntervalSeconds: 45 });
    service = createService(true);

    await service.onApplicationBootstrap();

    expect(service.getEffectiveIntervalSeconds()).toBe(45);
    expect(service.getHealthStatus().recommendedPollSeconds).toBe(45);
  });

  it('identifica estados running, no_data e failed com etapa/mensagem de erro', async () => {
    service = createService();

    let finishSync!: () => void;
    regionsService.syncRegions.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishSync = resolve;
        }),
    );

    const bootPromise = service.onApplicationBootstrap();
    await Promise.resolve();
    expect(service.getHealthStatus().status).toBe('running');
    expect(service.getHealthStatus().isRunning).toBe(true);

    collectionsService.syncCollections.mockResolvedValueOnce({ total: 0, collections: [] });
    finishSync();
    await bootPromise;
    expect(service.getHealthStatus().status).toBe('no_data');
    expect(service.getHealthStatus().recordsSaved).toBe(0);

    servicesService.syncServices.mockRejectedValueOnce(new Error('Timeout no catálogo'));
    await jest.advanceTimersByTimeAsync(30_000);

    const failedHealth = service.getHealthStatus();
    expect(failedHealth.status).toBe('failed');
    expect(failedHealth.errorStage).toBe('descoberta de serviços');
    expect(failedHealth.errorMessage).toBe('Timeout no catálogo');
    expect(failedHealth.recordsSaved).toBe(0);
  });

  it('reagenda dinamicamente via SchedulerRegistry sem reiniciar e atualiza nextRunAt', async () => {
    service = createService();
    await service.onApplicationBootstrap();

    const updated = service.reschedulePeriodicSync(15);

    expect(schedulerRegistry.deleteInterval).toHaveBeenCalledWith('green-byte-periodic-sync');
    expect(schedulerRegistry.addInterval).toHaveBeenCalledTimes(2);
    expect(updated.effectiveIntervalSeconds).toBe(15);
    expect(updated.recommendedPollSeconds).toBe(15);
    expect(updated.nextRunAt).not.toBeNull();

    // Avança 15s e confirma novo disparo sem esperar 30s
    await jest.advanceTimersByTimeAsync(15_000);
    expect(regionsService.syncRegions).toHaveBeenCalledTimes(2);
  });

  it('rejeita intervalos inválidos no reagendamento dinâmico', () => {
    service = createService();
    expect(() => service.reschedulePeriodicSync(0)).toThrow(BadRequestException);
    expect(() => service.reschedulePeriodicSync(12.5)).toThrow(BadRequestException);
  });

  it('não inicia um novo ciclo enquanto o anterior ainda está em execução', async () => {
    service = createService();
    await service.onApplicationBootstrap();

    let finishCurrentSync!: () => void;
    regionsService.syncRegions.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishCurrentSync = resolve;
        }),
    );

    await jest.advanceTimersByTimeAsync(30_000);
    await jest.advanceTimersByTimeAsync(30_000);

    // Uma chamada inicial e apenas uma chamada periódica; a segunda batida é ignorada.
    expect(regionsService.syncRegions).toHaveBeenCalledTimes(2);

    finishCurrentSync();
    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(30_000);
    expect(regionsService.syncRegions).toHaveBeenCalledTimes(3);
  });

  it('rejeita intervalos que não sejam inteiros positivos', () => {
    process.env.COLLECTION_INTERVAL_SECONDS = '0';

    expect(() => createService()).toThrow(
      'COLLECTION_INTERVAL_SECONDS deve estar entre 1 e 2147483 segundos.',
    );
  });

  it('rejeita valores não numéricos para o intervalo', () => {
    process.env.COLLECTION_INTERVAL_SECONDS = 'trinta';

    expect(() => createService()).toThrow(
      'COLLECTION_INTERVAL_SECONDS deve ser um número inteiro positivo expresso em segundos.',
    );
  });

  it('continua o startup e registra o agendamento mesmo quando o ciclo inicial falha', async () => {
    regionsService.syncRegions.mockRejectedValueOnce(new Error('API indisponível'));
    service = createService();

    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();

    expect(servicesService.syncServices).not.toHaveBeenCalled();
    expect(collectionsService.syncCollections).not.toHaveBeenCalled();
    expect(schedulerRegistry.addInterval).toHaveBeenCalledTimes(1);
    expect(service.getHealthStatus().status).toBe('failed');
    expect(service.getHealthStatus().errorStage).toBe('regiões');
  });

  it('registra falha na etapa de coleta de métricas (incluindo erro não-Error) e tolera falha ao ler settings', async () => {
    settingsRepository.getSettings.mockRejectedValueOnce(new Error('Banco indisponível'));
    collectionsService.syncCollections.mockRejectedValueOnce('falha-string');
    service = createService(true);

    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();

    const health = service.getHealthStatus();
    expect(health.effectiveIntervalSeconds).toBe(30);
    expect(health.status).toBe('failed');
    expect(health.errorStage).toBe('coleta de métricas');
    expect(health.errorMessage).toBe('falha-string');
  });
});
