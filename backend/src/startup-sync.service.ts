import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { RegionsService } from './modules/regions/regions.service';
import { ServicesService } from './modules/services/services.service';
import { CollectionsService } from './modules/collections/collections.service';

const DEFAULT_COLLECTION_INTERVAL_SECONDS = 30;
const MAX_INTERVAL_SECONDS = Math.floor(2_147_483_647 / 1_000);
const PERIODIC_SYNC_INTERVAL_NAME = 'green-byte-periodic-sync';

@Injectable()
export class StartupSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupSyncService.name);
  private readonly collectionIntervalMs: number;
  private isSyncRunning = false;
  private isPeriodicSyncScheduled = false;

  constructor(
    private readonly regionsService: RegionsService,
    private readonly servicesService: ServicesService,
    private readonly collectionsService: CollectionsService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.collectionIntervalMs =
      this.readCollectionIntervalSeconds() * 1_000;
  }

  /**
   * Executa uma sincronização inicial antes de iniciar o agendamento periódico.
   * O intervalo configurado começa a contar após a conclusão deste primeiro ciclo.
   */
  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Iniciando sincronização automática de startup...');
    await this.runFullSync('inicialização');
    this.schedulePeriodicSync();
  }

  private schedulePeriodicSync(): void {
    if (this.isPeriodicSyncScheduled) {
      this.logger.warn('O agendamento periódico já está registrado; ignorando duplicidade.');
      return;
    }

    const interval = setInterval(() => {
      void this.runFullSync('periódico');
    }, this.collectionIntervalMs);

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
  private async runFullSync(trigger: 'inicialização' | 'periódico'): Promise<void> {
    if (this.isSyncRunning) {
      this.logger.warn(
        `Ciclo ${trigger} ignorado: já existe uma sincronização em andamento.`,
      );
      return;
    }

    this.isSyncRunning = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    let currentStep = 'regiões';
    let succeeded = false;

    this.logger.log(`[${trigger}] Ciclo de sincronização iniciado em ${startedAtIso}.`);

    try {
      // 1. Regiões: garante que os dados de referência estejam disponíveis.
      await this.regionsService.syncRegions();

      // 2. Descoberta e atualização dos serviços disponíveis.
      currentStep = 'descoberta de serviços';
      await this.servicesService.syncServices();

      // 3. Coleta e persistência das métricas dos serviços.
      currentStep = 'coleta de métricas';
      await this.collectionsService.syncCollections();

      succeeded = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `[${trigger}] Falha durante a etapa de ${currentStep}: ${message}`,
        stack,
      );
    } finally {
      const finishedAt = Date.now();
      const finishedAtIso = new Date(finishedAt).toISOString();
      const durationMs = finishedAt - startedAt;
      const result = succeeded ? 'sucesso' : 'concluído com falhas';

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
      intervalSeconds < 1 ||
      intervalSeconds > MAX_INTERVAL_SECONDS
    ) {
      throw new Error(
        `COLLECTION_INTERVAL_SECONDS deve estar entre 1 e ${MAX_INTERVAL_SECONDS} segundos.`,
      );
    }

    return intervalSeconds;
  }
}
