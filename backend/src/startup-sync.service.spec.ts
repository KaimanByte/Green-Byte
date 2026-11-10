import { jest } from '@jest/globals';
import type { SchedulerRegistry } from '@nestjs/schedule';
import type { CollectionsService } from './modules/collections/collections.service';
import type { RegionsService } from './modules/regions/regions.service';
import type { ServicesService } from './modules/services/services.service';
import { StartupSyncService } from './startup-sync.service';

type AsyncFn = () => Promise<void>;

type SchedulerRegistryMock = {
  addInterval: jest.Mock<(name: string, interval: NodeJS.Timeout) => void>;
};

describe('StartupSyncService', () => {
  let service: StartupSyncService;
  let regionsService: { syncRegions: jest.Mock<AsyncFn> };
  let servicesService: { syncServices: jest.Mock<AsyncFn> };
  let collectionsService: { syncCollections: jest.Mock<AsyncFn> };
  let schedulerRegistry: SchedulerRegistryMock;
  const originalInterval = process.env.COLLECTION_INTERVAL_SECONDS;

  beforeEach(() => {
    jest.useFakeTimers();
    delete process.env.COLLECTION_INTERVAL_SECONDS;

    regionsService = { syncRegions: jest.fn<AsyncFn>() };
    servicesService = { syncServices: jest.fn<AsyncFn>() };
    collectionsService = { syncCollections: jest.fn<AsyncFn>() };
    schedulerRegistry = {
      addInterval: jest.fn<(name: string, interval: NodeJS.Timeout) => void>(),
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

  function createService(): StartupSyncService {
    return new StartupSyncService(
      regionsService as unknown as RegionsService,
      servicesService as unknown as ServicesService,
      collectionsService as unknown as CollectionsService,
      schedulerRegistry as unknown as SchedulerRegistry,
    );
  }

  it('executa a sincronização inicial e registra o intervalo padrão de 30 segundos', async () => {
    service = createService();

    await service.onApplicationBootstrap();

    expect(regionsService.syncRegions).toHaveBeenCalledTimes(1);
    expect(servicesService.syncServices).toHaveBeenCalledTimes(1);
    expect(collectionsService.syncCollections).toHaveBeenCalledTimes(1);
    expect(schedulerRegistry.addInterval).toHaveBeenCalledTimes(1);
    expect(schedulerRegistry.addInterval).toHaveBeenCalledWith(
      'green-byte-periodic-sync',
      expect.anything(),
    );
  });

  it('utiliza o intervalo definido em COLLECTION_INTERVAL_SECONDS', async () => {
    process.env.COLLECTION_INTERVAL_SECONDS = '120';
    service = createService();

    await service.onApplicationBootstrap();
    await jest.advanceTimersByTimeAsync(119_999);

    expect(regionsService.syncRegions).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);

    expect(regionsService.syncRegions).toHaveBeenCalledTimes(2);
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

    expect(createService).toThrow(
      'COLLECTION_INTERVAL_SECONDS deve estar entre 1 e 2147483 segundos.',
    );
  });

  it('rejeita valores não numéricos para o intervalo', () => {
    process.env.COLLECTION_INTERVAL_SECONDS = 'trinta';

    expect(createService).toThrow(
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
  });
});
