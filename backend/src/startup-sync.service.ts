import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { RegionsService } from './modules/regions/regions.service';
import { ServicesService } from './modules/services/services.service';
import { CollectionsService } from './modules/collections/collections.service';
import { SettingsService } from './modules/settings/settings.service';
import { readCollectionIntervalFromEnv } from './common/collection-interval';

const PERIODIC_SYNC_INTERVAL_NAME = 'green-byte-periodic-sync';

type SyncTrigger = 'inicialização' | 'periódico';

/** Resultado do último ciclo de sincronização, para o indicador de saúde da coleta. */
export interface SyncCycleStatus {
  trigger: SyncTrigger;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  succeeded: boolean;
  /** etapa em que o ciclo falhou, ou null */
  failedStep: string | null;
  errorMessage: string | null;
  /** coletas gravadas no ciclo */
  collectionsSaved: number;
}

export interface CollectionStatus {
  intervalSeconds: number;
  isRunning: boolean;
  /** próximo disparo do agendador, ou null antes do primeiro agendamento */
  nextRunAt: Date | null;
  lastCycle: SyncCycleStatus | null;
}

@Injectable()
export class StartupSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupSyncService.name);
  private collectionIntervalMs: number;
  private isSyncRunning = false;
  private isPeriodicSyncScheduled = false;
  private lastCycle: SyncCycleStatus | null = null;
  private nextRunAt: Date | null = null;

  constructor(
    private readonly regionsService: RegionsService,
    private readonly servicesService: ServicesService,
    private readonly collectionsService: CollectionsService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly settingsService: SettingsService,
  ) {
    // valor do .env validado já na criação: um intervalo inválido derruba o startup
    this.collectionIntervalMs = readCollectionIntervalFromEnv() * 1_000;
  }

  /**
   * Executa uma sincronização inicial antes de iniciar o agendamento periódico.
   * O intervalo configurado começa a contar após a conclusão deste primeiro ciclo.
   */
  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Iniciando sincronização automática de startup...');
    await this.loadConfiguredInterval();
    this.settingsService.onIntervalChange((seconds) => this.reschedule(seconds));
    await this.runFullSync('inicialização');
    this.schedulePeriodicSync();
  }

  /** Situação atual da coleta (para o painel administrativo). */
  getStatus(): CollectionStatus {
    return {
      intervalSeconds: this.collectionIntervalMs / 1_000,
      isRunning: this.isSyncRunning,
      nextRunAt: this.nextRunAt,
      lastCycle: this.lastCycle,
    };
  }

  /**
   * O intervalo salvo pelo administrador (banco) vale mais que o do .env.
   * Se o banco não responder, a coleta segue com o valor do .env.
   */
  private async loadConfiguredInterval(): Promise<void> {
    try {
      const settings = await this.settingsService.getSettings();
      this.collectionIntervalMs = settings.collectionIntervalSeconds * 1_000;
    } catch (error) {
      this.logger.warn(
        `Não foi possível ler o intervalo configurado; usando o do ambiente. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Aplica um novo intervalo na hora: troca o temporizador sem reiniciar o backend. */
  private reschedule(intervalSeconds: number): void {
    this.collectionIntervalMs = intervalSeconds * 1_000;
    // ainda no ciclo inicial: o agendamento que vem a seguir já usa o novo valor
    if (!this.isPeriodicSyncScheduled) return;

    this.schedulerRegistry.deleteInterval(PERIODIC_SYNC_INTERVAL_NAME);
    this.isPeriodicSyncScheduled = false;
    this.schedulePeriodicSync();
  }

  private schedulePeriodicSync(): void {
    if (this.isPeriodicSyncScheduled) {
      this.logger.warn('O agendamento periódico já está registrado; ignorando duplicidade.');
      return;
    }

    const intervalMs = this.collectionIntervalMs;
    const interval = setInterval(() => {
      this.nextRunAt = new Date(Date.now() + intervalMs);
      void this.runFullSync('periódico');
    }, intervalMs);
    this.nextRunAt = new Date(Date.now() + intervalMs);

    this.schedulerRegistry.addInterval(PERIODIC_SYNC_INTERVAL_NAME, interval);
    this.isPeriodicSyncScheduled = true;

    this.logger.log(
      `Coleta periódica agendada a cada ${this.collectionIntervalMs / 1_000} segundo(s).`,
    );
  }

  /**
   * Executa descoberta e coleta em sequência. A trava impede que um novo ciclo
   * comece enquanto o anterior ainda estiver em execução.
   */
  private async runFullSync(trigger: SyncTrigger): Promise<void> {
    if (this.isSyncRunning) {
      this.logger.warn(
        `Ciclo ${trigger} ignorado: já existe uma sincronização em andamento.`,
      );
      return;
    }

    this.isSyncRunning = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    let failedStep: string | null = null;
    let succeeded = false;
    let errorMessage: string | null = null;
    let collectionsSaved = 0;

    this.logger.log(`[${trigger}] Ciclo de sincronização iniciado em ${startedAtIso}.`);

    // Cada etapa roda mesmo que a anterior falhe: as APIs externas só alimentam o banco, então
    // a coleta usa as regiões e os serviços já gravados. Assim, com uma API fora do ar, cada
    // serviço ainda tem a tentativa de coleta registrada (e o painel mostra o estado real dele).
    // O ciclo só conta como sucesso se todas as etapas derem certo; vale a primeira falha.
    const runStep = async (step: string, action: () => Promise<void>) => {
      try {
        await action();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        this.logger.error(`[${trigger}] Falha durante a etapa de ${step}: ${message}`, stack);
        if (errorMessage === null) {
          errorMessage = message;
          failedStep = step;
        }
      }
    };

    try {
      // 1. Regiões: atualiza a intensidade de carbono de referência.
      await runStep('regiões', async () => {
        await this.regionsService.syncRegions();
      });

      // 2. Descoberta e atualização dos serviços disponíveis.
      await runStep('descoberta de serviços', async () => {
        await this.servicesService.syncServices();
      });

      // 3. Coleta e persistência das métricas dos serviços.
      await runStep('coleta de métricas', async () => {
        const result = await this.collectionsService.syncCollections();
        collectionsSaved = result?.total ?? 0;
      });

      succeeded = errorMessage === null;
    } finally {
      const finishedAt = Date.now();
      const finishedAtIso = new Date(finishedAt).toISOString();
      const durationMs = finishedAt - startedAt;
      const result = succeeded ? 'sucesso' : 'concluído com falhas';

      this.logger.log(
        `[${trigger}] Ciclo ${result}. Início: ${startedAtIso}; fim: ${finishedAtIso}; duração: ${durationMs} ms.`,
      );
      this.lastCycle = {
        trigger,
        startedAt: new Date(startedAt),
        finishedAt: new Date(finishedAt),
        durationMs,
        succeeded,
        failedStep: succeeded ? null : failedStep,
        errorMessage,
        collectionsSaved,
      };
      this.isSyncRunning = false;
    }
  }
}
