import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule'; // <-- Adicionado o import do Cron
import { RegionsService } from './modules/regions/regions.service';
import { ServicesService } from './modules/services/services.service';
import { CollectionsService } from './modules/collections/collections.service';

@Injectable()
export class StartupSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupSyncService.name);

  constructor(
    private readonly regionsService: RegionsService,
    private readonly servicesService: ServicesService,
    private readonly collectionsService: CollectionsService,
  ) {}

  // 1. Executa apenas uma vez quando o backend liga
  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Iniciando sincronização automática de startup...');
    await this.runFullSync();
    this.logger.log('Sincronização inicial concluída com sucesso!');
  }

  // 2. Executa perpetuamente a cada 30 segundos
  @Cron('*/30 * * * * *')
  async handlePeriodicSync() {
    this.logger.log('Cron 30s: Atualizando infraestrutura e métricas...');
    await this.runFullSync();
  }

  // 3. Lógica centralizada de sincronização em cascata
  private async runFullSync(): Promise<void> {
    try {
      // 1. Regiões (Garante a tabela pai)
      await this.regionsService.syncRegions();
      
      // 2. Serviços 
      // (Nota: se você criar um método que busca na API externa depois, troque findAllServices por ele, ex: syncServices)
      await this.servicesService.syncServices();
      
      // 3. Coletas
      await this.collectionsService.syncCollections();
      
    } catch (error) {
      this.logger.error(
        'Falha na sincronização em cascata:',
        error instanceof Error ? error.message : error,
      );
    }
  }
}