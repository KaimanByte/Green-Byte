import { jest } from '@jest/globals';
import type { SchedulerRegistry } from '@nestjs/schedule';
import type { CollectionsService } from './modules/collections/collections.service';
import type { RegionsService } from './modules/regions/regions.service';
import type { ServicesService } from './modules/services/services.service';
import type { SettingsService } from './modules/settings/settings.service';
import { readCollectionIntervalFromEnv } from './common/collection-interval';
import { StartupSyncService } from './startup-sync.service';

type AsyncFn = () => Promise<void>;

type SchedulerRegistryMock = {
  addInterval: jest.Mock<(name: string, interval: NodeJS.Timeout) => void>;
  deleteInterval: jest.Mock<(name: string) => void>;
};

describe('StartupSyncService', () => {
  let service: StartupSyncService;
  let regionsService: { syncRegions: jest.Mock<AsyncFn> };
  let servicesService: { syncServices: jest.Mock<AsyncFn> };
  let collectionsService: { syncCollections: jest.Mock<AsyncFn> };
  let schedulerRegistry: SchedulerRegistryMock;
  let settingsService: {
    getSettings: jest.Mock<() => Promise<{ collectionIntervalSeconds: number }>>;
    onIntervalChange: jest.Mock<(listener: (seconds: number) => void) => void>;
  };
  const originalInterval = process.env.COLLECTION_INTERVAL_SECONDS;

  beforeEach(() => {
    jest.useFakeTimers();
    delete process.env.COLLECTION_INTERVAL_SECONDS;

    regionsService = { syncRegions: jest.fn<AsyncFn>() };
    servicesService = { syncServices: jest.fn<AsyncFn>() };
    collectionsService = { syncCollections: jest.fn<AsyncFn>() };
    schedulerRegistry = {
      addInterval: jest.fn<(name: string, interval: NodeJS.Timeout) => void>(),
      // como o SchedulerRegistry de verdade: remover o intervalo também para o temporizador
      deleteInterval: jest.fn<(name: string) => void>(() => {
        clearInterval(schedulerRegistry.addInterval.mock.calls.at(-1)?.[1]);
      }),
    };
    // primeira leitura: a configuração nasce com o intervalo do .env
    settingsService = {
      getSettings: jest.fn(async () => ({ collectionIntervalSeconds: readCollectionIntervalFromEnv() })),
      onIntervalChange: jest.fn<(listener: (seconds: number) => void) => void>(),
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
      settingsService as unknown as SettingsService,
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

    // as etapas seguintes rodam com o que já está no banco: a coleta registra o estado de cada serviço
    expect(servicesService.syncServices).toHaveBeenCalledTimes(1);
    expect(collectionsService.syncCollections).toHaveBeenCalledTimes(1);
    expect(schedulerRegistry.addInterval).toHaveBeenCalledTimes(1);
    expect(service.getStatus().lastCycle).toMatchObject({ succeeded: false, failedStep: 'regiões' });
  });

  it('usa o intervalo salvo no banco no lugar do valor do .env', async () => {
    process.env.COLLECTION_INTERVAL_SECONDS = '120';
    settingsService.getSettings.mockResolvedValue({ collectionIntervalSeconds: 45 });
    service = createService();

    await service.onApplicationBootstrap();
    await jest.advanceTimersByTimeAsync(45_000);

    expect(regionsService.syncRegions).toHaveBeenCalledTimes(2);
    expect(service.getStatus().intervalSeconds).toBe(45);
  });

  it('segue com o intervalo do .env quando a configuração não pode ser lida', async () => {
    settingsService.getSettings.mockRejectedValue(new Error('banco fora do ar'));
    service = createService();

    await service.onApplicationBootstrap();

    expect(service.getStatus().intervalSeconds).toBe(30);
    expect(schedulerRegistry.addInterval).toHaveBeenCalledTimes(1);
  });

  it('reprograma a coleta na hora quando o intervalo é alterado', async () => {
    service = createService();
    await service.onApplicationBootstrap();
    const changeInterval = settingsService.onIntervalChange.mock.calls[0][0];

    changeInterval(10);

    expect(schedulerRegistry.deleteInterval).toHaveBeenCalledWith('green-byte-periodic-sync');
    expect(schedulerRegistry.addInterval).toHaveBeenCalledTimes(2);
    expect(service.getStatus().intervalSeconds).toBe(10);

    await jest.advanceTimersByTimeAsync(10_000);
    expect(regionsService.syncRegions).toHaveBeenCalledTimes(2);
    // o temporizador antigo (30 s) foi removido: não dispara um ciclo a mais
    await jest.advanceTimersByTimeAsync(20_000);
    expect(regionsService.syncRegions).toHaveBeenCalledTimes(4);
  });

  it('expõe o resultado do último ciclo, inclusive a etapa que falhou', async () => {
    servicesService.syncServices.mockRejectedValueOnce(new Error('API fora do ar'));
    service = createService();

    await service.onApplicationBootstrap();

    const status = service.getStatus();
    expect(status.isRunning).toBe(false);
    expect(status.nextRunAt).toBeInstanceOf(Date);
    expect(status.lastCycle).toMatchObject({
      trigger: 'inicialização',
      succeeded: false,
      failedStep: 'descoberta de serviços',
      errorMessage: 'API fora do ar',
      collectionsSaved: 0,
    });
  });
});
