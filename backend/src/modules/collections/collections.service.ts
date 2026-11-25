import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CollectionsRepository, RegionEmissions, ServiceEmissions } from './collections.repository';
import { NewCollection } from './collections.schema';
import { CollectionHistoryQuery } from './collection-history.query';
import { CollectionResponseDto, SyncCollectionsResponseDto } from './dto/collection.dto';
import { EnergyCalculator } from './energy.calculator';
import { ServicesService } from '../services/services.service';
import { RegionsService } from '../regions/regions.service';
import { InvalidMetricsException, MetricsApiClient } from '../integrations/metrics-api.client';
import { SettingsService } from '../settings/settings.service';
import type { CollectionResult } from '../services/services.repository';
import type { CollectionState } from '../services/services.schema';

/**
 * Estado de um serviço cuja coleta falhou:
 * - sem métricas: a API respondeu, mas sem números utilizáveis (métricas ausentes ou inválidas,
 *   cálculo inválido, ou a região do serviço não está cadastrada para calcular o CO₂e);
 * - indisponível: não deu para obter as métricas (API fora do ar, erro HTTP, tempo esgotado).
 */
export function collectionFailureState(error: unknown): Exclude<CollectionState, 'active'> {
  return error instanceof InvalidMetricsException || error instanceof NotFoundException
    ? 'no_metrics'
    : 'unavailable';
}

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(
    private readonly collectionsRepository: CollectionsRepository,
    private readonly servicesService: ServicesService,
    private readonly regionsService: RegionsService,
    private readonly metricsApi: MetricsApiClient,
    private readonly energyCalculator: EnergyCalculator,
    private readonly settingsService: SettingsService,
  ) {}

  async findByServiceId(serviceId: string, limit = 100): Promise<CollectionResponseDto[]> {
    return this.collectionsRepository.findByServiceId(serviceId, limit);
  }

  /**
   * Histórico cronológico de um serviço com intervalo opcional [from, to] inclusivo.
   */
  async findHistory(query: CollectionHistoryQuery): Promise<CollectionResponseDto[]> {
    const { from, to, limit } = query;

    if ((from && isNaN(from.getTime())) || (to && isNaN(to.getTime()))) {
      throw new BadRequestException('Datas "from" e "to" devem ser válidas (ISO 8601).');
    }
    if (from && to && from.getTime() > to.getTime()) {
      throw new BadRequestException('"from" não pode ser posterior a "to".');
    }
    if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
      throw new BadRequestException('"limit" deve ser um inteiro positivo.');
    }

    return this.collectionsRepository.findHistory(query);
  }

  async getEmissionsByRegion(start?: Date, end?: Date): Promise<RegionEmissions[]> {
    const validEnd = end instanceof Date && !isNaN(end.getTime()) ? end : new Date();
    const validStart = start instanceof Date && !isNaN(start.getTime())
      ? start
      : new Date(validEnd.getTime() - 24 * 60 * 60 * 1000);

    return this.collectionsRepository.getEmissionsByRegion(validStart, validEnd);
  }

  async getEmissionsByService(start?: Date, end?: Date): Promise<ServiceEmissions[]> {
    const validEnd = end instanceof Date && !isNaN(end.getTime()) ? end : new Date();
    const validStart = start instanceof Date && !isNaN(start.getTime())
      ? start
      : new Date(validEnd.getTime() - 24 * 60 * 60 * 1000);

    return this.collectionsRepository.getEmissionsByService(validStart, validEnd);
  }

  /**
   * Sincroniza as métricas de todos os serviços conhecidos e calcula o CO2
   */
  async syncCollections(): Promise<SyncCollectionsResponseDto> {
    const services = await this.servicesService.findAllServices();

    if (services.length === 0) {
      this.logger.warn('Nenhum serviço registrado para coletar métricas.');
      return { total: 0, collections: [] };
    }

    // parâmetros da máquina lidos uma vez por ciclo: todas as coletas do ciclo usam o mesmo modelo
    const energyModel = await this.settingsService.getEnergyModel();
    const newCollections: NewCollection[] = [];
    // como foi a coleta de cada serviço neste ciclo: é o que o painel mostra como estado atual
    const results: CollectionResult[] = [];
    const attemptedAt = new Date();

    for (const service of services) {
      try {
        const payload = await this.metricsApi.getServiceMetrics(service.id);
        const region = await this.regionsService.findRegionByCode(service.regionCode);

        const usage = {
          cpuPercent: payload.metrics.cpu_percent,
          memoryGb: payload.metrics.memory_gb,
          diskGb: payload.metrics.disk_gb,
          networkGb: payload.metrics.network_gb,
        };
        const { energyKwh, co2Emissions } = this.energyCalculator.calculate(
          usage,
          payload.collection_interval_seconds,
          region.carbonIntensity,
          energyModel,
        );

        if (!Number.isFinite(energyKwh) || !Number.isFinite(co2Emissions) || energyKwh < 0 || co2Emissions < 0) {
          throw new InvalidMetricsException(`Cálculo de ${service.id} resultou em valor inválido.`);
        }

        // a rede entra no cálculo de energia, mas não tem coluna própria no banco
        newCollections.push({
          serviceId: service.id,
          cpuPercent: usage.cpuPercent,
          memoryGb: usage.memoryGb,
          diskGb: usage.diskGb,
          energyKwh,
          co2Emissions,
        });
        results.push({ serviceId: service.id, state: 'active', attemptedAt, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        this.logger.warn(`Falha ao coletar métricas para o serviço ${service.id}: ${message}`);
        results.push({ serviceId: service.id, state: collectionFailureState(error), attemptedAt, error: message });
      }
    }

    const saved = await this.collectionsRepository.insertMany(newCollections);
    await this.servicesService.recordCollectionResults(results);

    return {
      total: saved.length,
      collections: saved,
    };
  }
}
