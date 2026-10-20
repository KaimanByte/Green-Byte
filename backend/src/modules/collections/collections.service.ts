import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CollectionsRepository, RegionEmissions, ServiceEmissions } from './collections.repository';
import { NewCollection } from './collections.schema';
import { CollectionResponseDto, SyncCollectionsResponseDto } from './dto/collection.dto';
import { ServicesService } from '../services/services.service';
import { RegionsService } from '../regions/regions.service';

interface MetricsPayload {
  collection_interval_seconds: number;
  metrics: {
    cpu_percent: number;
    memory_gb: number;
    disk_gb: number;
    network_gb: number;
  };
}

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);
  private readonly metricsBaseUrl: string;
  private readonly requestTimeoutMs = 5_000;

  constructor(
    private readonly collectionsRepository: CollectionsRepository,
    private readonly servicesService: ServicesService,
    private readonly regionsService: RegionsService,
  ) {
    const baseUrl = process.env.METRICS_API_BASE_URL || 'https://metrics.unilaunch.org';
    this.metricsBaseUrl = baseUrl.replace(/\/+$/, '');
  }

  async findByServiceId(serviceId: string, limit = 100): Promise<CollectionResponseDto[]> {
    const collections = await this.collectionsRepository.findByServiceId(serviceId, limit);
    return collections;
  }

  async getEmissionsByRegion(start?: Date, end?: Date): Promise<RegionEmissions[]> {
    // Se 'end' não for uma data válida, usa a data/hora atual
    const validEnd = end instanceof Date && !isNaN(end.getTime()) ? end : new Date();

    // Se 'start' não for uma data válida, retrocede 24 horas a partir do 'validEnd'
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

    const newCollections: NewCollection[] = [];

    for (const service of services) {
      try {
        const payload = await this.fetchServiceMetrics(service.id);

        // Busca a intensidade de carbono baseada no regionCode do serviço
        const region = await this.regionsService.findRegionByCode(service.regionCode);
        const carbonIntensity = region.carbonIntensity; // Baseado no seu DTO de região

        // Algoritmo simulado de cálculo de energia em kWh baseado no uso (ajuste conforme a regra de negócio real)
        const powerWatts = (payload.metrics.cpu_percent * 2) + (payload.metrics.memory_gb * 1.5) + (payload.metrics.disk_gb * 0.5);
        const hours = payload.collection_interval_seconds / 3600;
        const energyKwh = (powerWatts * hours) / 1000;

        // CO2e = energia_kWh × carbon_intensity_gco2e_per_kwh
        const co2Emissions = energyKwh * carbonIntensity;

        newCollections.push({
          serviceId: service.id,
          cpuPercent: payload.metrics.cpu_percent,
          memoryGb: payload.metrics.memory_gb,
          diskGb: payload.metrics.disk_gb,
          energyKwh: energyKwh,
          co2Emissions: co2Emissions,
        });

      } catch (error) {
        this.logger.warn(`Falha ao coletar métricas para o serviço ${service.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        continue; // Continua para o próximo serviço mesmo se um falhar
      }
    }

    const saved = await this.collectionsRepository.insertMany(newCollections);

    return {
      total: saved.length,
      collections: saved,
    };
  }

  private async fetchServiceMetrics(serviceId: string): Promise<MetricsPayload> {
    const url = `${this.metricsBaseUrl}/metrics/${serviceId}`;
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.requestTimeoutMs),
      });
    } catch (error: unknown) {
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new GatewayTimeoutException(`Timeout ao buscar métricas de ${serviceId}`);
      }
      throw new ServiceUnavailableException(`Indisponível para buscar métricas de ${serviceId}`);
    }

    if (!response.ok) {
      throw new BadGatewayException(`Erro HTTP ${response.status} ao buscar métricas de ${serviceId}`);
    }

    return response.json();
  }
}