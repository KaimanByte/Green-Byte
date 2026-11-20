import {
  BadRequestException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  Optional,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { RegionsService } from './modules/regions/regions.service';
import { ServicesService } from './modules/services/services.service';
import { CollectionsService } from './modules/collections/collections.service';
import { SettingsRepository } from './modules/settings/settings.repository';
import {
  DEFAULT_COLLECTION_INTERVAL_SECONDS,
  MAX_COLLECTION_INTERVAL_SECONDS,
  MIN_COLLECTION_INTERVAL_SECONDS,
  resolveRecommendedPollSeconds,
} from './modules/settings/polling-interval';

const PERIODIC_SYNC_INTERVAL_NAME = 'green-byte-periodic-sync';

export type CollectionCycleResultStatus = 'success' | 'failed' | 'no_data';
export type CollectionOperationalStatus = 'running' | CollectionCycleResultStatus;
export type CollectionSyncTrigger = 'inicialização' | 'periódico';

export interface LastCycleHealth {
  trigger: CollectionSyncTrigger;
  status: CollectionCycleResultStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  recordsSaved: number;
  errorStage: string | null;
  errorMessage: string | null;
}

export interface CollectionHealthSnapshot {
  status: CollectionOperationalStatus;
  isRunning: boolean;
  effectiveIntervalSeconds: number;
  effectiveIntervalMs: number;
  recommendedPollSeconds: number;
  recommendedPollMs: number;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastFinishedAt: string | null;
  lastDurationMs: number | null;
  recordsSaved: number;
  errorStage: string | null;
  errorMessage: string | null;
  lastCycle: LastCycleHealth | null;
}

@Injectable()
export class StartupSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupSyncService.name);
  private collectionIntervalMs: number;
  private isSyncRunning = false;
  private isPeriodicSyncScheduled = false;
  private periodicTimer: NodeJS.Timeout | null = null;
  private currentRunStartedAtIso: string | null = null;
  private nextRunAt: Date | null = null;
  private lastCycle: LastCycleHealth | null = null;

  constructor(
    private readonly regionsService: RegionsService,
    private readonly servicesService: ServicesService,
    private readonly collectionsService: CollectionsService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @Optional() private readonly settingsRepository?: SettingsRepository,
  ) {
    this.collectionIntervalMs = this.readCollectionIntervalSeconds() * 1_000;
  }

  /**
   * Carrega o intervalo persistido (quando não sobrescrito via env), executa a
   * sincronização inicial e inicia o agendamento periódico.
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.loadPersistedInterval();
    this.logger.log('Iniciando sincronização automática de startup...');
    await this.runFullSync('inicialização');
    this.schedulePeriodicSync();
  }

  getEffectiveIntervalSeconds(): number {
    return Math.round(this.collectionIntervalMs / 1_000);
  }

  getHealthStatus(): CollectionHealthSnapshot {
    const effectiveIntervalSeconds = this.getEffectiveIntervalSeconds();
    const recommendedPollSeconds = resolveRecommendedPollSeconds(effectiveIntervalSeconds);
    const status: CollectionOperationalStatus = this.isSyncRunning
      ? 'running'
      : (this.lastCycle?.status ?? 'no_data');

    return {
      status,
      isRunning: this.isSyncRunning,
      effectiveIntervalSeconds,
      effectiveIntervalMs: this.collectionIntervalMs,
      recommendedPollSeconds,
      recommendedPollMs: recommendedPollSeconds * 1_000,
      nextRunAt: this.nextRunAt ? this.nextRunAt.toISOString() : null,
      lastRunAt: this.currentRunStartedAtIso ?? this.lastCycle?.startedAt ?? null,
      lastFinishedAt: this.lastCycle?.finishedAt ?? null,
      lastDurationMs: this.lastCycle?.durationMs ?? null,
      recordsSaved: this.lastCycle?.recordsSaved ?? 0,
      errorStage: this.lastCycle?.errorStage ?? null,
      errorMessage: this.lastCycle?.errorMessage ?? null,
      lastCycle: this.lastCycle,
    };
  }

  /**
   * Reagenda o intervalo periódico em tempo de execução sem reiniciar o backend,
   * removendo o timer anterior do `SchedulerRegistry` e registrando o novo.
   */
  reschedulePeriodicSync(intervalSeconds: number): CollectionHealthSnapshot {
    if (
      !Number.isSafeInteger(intervalSeconds) ||
      intervalSeconds < MIN_COLLECTION_INTERVAL_SECONDS ||
      intervalSeconds > MAX_COLLECTION_INTERVAL_SECONDS
    ) {
      throw new BadRequestException(
        `O intervalo de coleta deve ser um inteiro entre ${MIN_COLLECTION_INTERVAL_SECONDS} e ${MAX_COLLECTION_INTERVAL_SECONDS} segundos.`,
      );
    }

    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
      this.periodicTimer = null;
    }

    if (this.isPeriodicSyncScheduled) {
      if (typeof this.schedulerRegistry.deleteInterval === 'function') {
        try {
          this.schedulerRegistry.deleteInterval(PERIODIC_SYNC_INTERVAL_NAME);
        } catch {
          // Ignora caso o intervalo já tenha sido removido ou seja um mock parcial.
        }
      }
      this.isPeriodicSyncScheduled = false;
    }

    this.collectionIntervalMs = intervalSeconds * 1_000;
    this.schedulePeriodicSync();
    return this.getHealthStatus();
  }

  private async loadPersistedInterval(): Promise<void> {
    if (!this.settingsRepository || process.env.COLLECTION_INTERVAL_SECONDS?.trim()) {
      return;
    }

    try {
      const persisted = await this.settingsRepository.getSettings();
      const seconds = persisted?.collectionIntervalSeconds;
      if (
        typeof seconds === 'number' &&
        Number.isSafeInteger(seconds) &&
        seconds >= MIN_COLLECTION_INTERVAL_SECONDS &&
        seconds <= MAX_COLLECTION_INTERVAL_SECONDS
      ) {
        this.collectionIntervalMs = seconds * 1_000;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Não foi possível carregar o intervalo persistido de coleta; usando padrão (${this.getEffectiveIntervalSeconds()}s): ${message}`,
      );
    }
  }

  private schedulePeriodicSync(): void {
    if (this.isPeriodicSyncScheduled) {
      this.logger.warn('O agendamento periódico já está registrado; ignorando duplicidade.');
      return;
    }

    const interval = setInterval(() => {
      void this.runFullSync('periódico');
    }, this.collectionIntervalMs);

    this.periodicTimer = interval;
    this.schedulerRegistry.addInterval(PERIODIC_SYNC_INTERVAL_NAME, interval);
    this.isPeriodicSyncScheduled = true;
    this.nextRunAt = new Date(Date.now() + this.collectionIntervalMs);

    this.logger.log(
      `Coleta periódica agendada a cada ${this.collectionIntervalMs / 1_000} segundo(s).`,
    );
  }

  /**
   * Executa descoberta e coleta em sequência. A trava impede que um novo ciclo
   * comece enquanto o anterior ainda estiver em execução.
   */
  private async runFullSync(trigger: CollectionSyncTrigger): Promise<void> {
    if (this.isSyncRunning) {
      this.logger.warn(
        `Ciclo ${trigger} ignorado: já existe uma sincronização em andamento.`,
      );
      return;
    }

    this.isSyncRunning = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    this.currentRunStartedAtIso = startedAtIso;

    let currentStep = 'regiões';
    let succeeded = false;
    let recordsSaved = 0;
    let cycleStatus: CollectionCycleResultStatus = 'failed';
    let errorStage: string | null = null;
    let errorMessage: string | null = null;

    this.logger.log(`[${trigger}] Ciclo de sincronização iniciado em ${startedAtIso}.`);

    try {
      // 1. Regiões: garante que os dados de referência estejam disponíveis.
      await this.regionsService.syncRegions();

      // 2. Descoberta e atualização dos serviços disponíveis.
      currentStep = 'descoberta de serviços';
      await this.servicesService.syncServices();

      // 3. Coleta e persistência das métricas dos serviços.
      currentStep = 'coleta de métricas';
      const syncResult = await this.collectionsService.syncCollections();
      const hasExplicitTotal = syncResult !== undefined && typeof syncResult?.total === 'number';
      recordsSaved = hasExplicitTotal ? syncResult.total : 0;
      cycleStatus = hasExplicitTotal && recordsSaved === 0 ? 'no_data' : 'success';
      succeeded = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      errorStage = currentStep;
      errorMessage = message;
      cycleStatus = 'failed';
      this.logger.error(
        `[${trigger}] Falha durante a etapa de ${currentStep}: ${message}`,
        stack,
      );
    } finally {
      const finishedAt = Date.now();
      const finishedAtIso = new Date(finishedAt).toISOString();
      const durationMs = finishedAt - startedAt;
      const result = succeeded ? 'sucesso' : 'concluído com falhas';

      this.lastCycle = {
        trigger,
        status: cycleStatus,
        startedAt: startedAtIso,
        finishedAt: finishedAtIso,
        durationMs,
        recordsSaved,
        errorStage,
        errorMessage,
      };
      this.currentRunStartedAtIso = null;
      if (this.isPeriodicSyncScheduled) {
        this.nextRunAt = new Date(finishedAt + this.collectionIntervalMs);
      }

      this.logger.log(
        `[${trigger}] Ciclo ${result}. Início: ${startedAtIso}; fim: ${finishedAtIso}; duração: ${durationMs} ms.`,
      );
      this.isSyncRunning = false;
    }
  }

  private readCollectionIntervalSeconds(): number {
    const configuredValue = process.env.COLLECTION_INTERVAL_SECONDS?.trim();

    if (!configuredValue) {
      return DEFAULT_COLLECTION_INTERVAL_SECONDS;
    }

    if (!/^\d+$/.test(configuredValue)) {
      throw new Error(
        'COLLECTION_INTERVAL_SECONDS deve ser um número inteiro positivo expresso em segundos.',
      );
    }

    const intervalSeconds = Number(configuredValue);
    if (
      !Number.isSafeInteger(intervalSeconds) ||
      intervalSeconds < MIN_COLLECTION_INTERVAL_SECONDS ||
      intervalSeconds > MAX_COLLECTION_INTERVAL_SECONDS
    ) {
      throw new Error(
        `COLLECTION_INTERVAL_SECONDS deve estar entre ${MIN_COLLECTION_INTERVAL_SECONDS} e ${MAX_COLLECTION_INTERVAL_SECONDS} segundos.`,
      );
    }

    return intervalSeconds;
  }
}
