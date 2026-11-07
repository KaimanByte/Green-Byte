import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CollectionsRepository, RegionEmissions, ServiceEmissions } from './collections.repository';
import { NewCollection } from './collections.schema';
import { CollectionHistoryQuery } from './collection-history.query';
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

  // Constantes de cálculo baseadas no modelo padrão
  private readonly CPU_MAX_POWER_W = 100;
  private readonly RAM_POWER_PER_GB_W = 0.375;
  private readonly DISK_POWER_PER_GB_W = 0.01;
  private readonly NETWORK_POWER_PER_GB_W = 0.02;

  constructor(
    private readonly collectionsRepository: CollectionsRepository,
    private readonly servicesService: ServicesService,
    private readonly regionsService: RegionsService,
  ) {
    const baseUrl = process.env.METRICS_API_BASE_URL || 'https://metrics.unilaunch.org';
    this.metricsBaseUrl = baseUrl.replace(/\/+$/, '');
  }

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

    const newCollections: NewCollection[] = [];

    for (const service of services) {
      try {
        const payload = await this.fetchServiceMetrics(service.id);
        const region = await this.regionsService.findRegionByCode(service.regionCode);
        const carbonIntensity = region.carbonIntensity;

        // 1. Cálculo de Potência (Watts) com o modelo padronizado
        const powerWatts = 
          ((payload.metrics.cpu_percent / 100) * this.CPU_MAX_POWER_W) +
          (payload.metrics.memory_gb * this.RAM_POWER_PER_GB_W) +
          (payload.metrics.disk_gb * this.DISK_POWER_PER_GB_W) +
          (payload.metrics.network_gb * this.NETWORK_POWER_PER_GB_W);

        // 2. Cálculo de Energia (kWh)
        const hours = payload.collection_interval_seconds / 3600;
        const energyKwh = (powerWatts * hours) / 1000;

        // 3. CO2e (gCO2e) = energia_kWh × carbon_intensity_gco2e_per_kwh
        const co2Emissions = energyKwh * carbonIntensity;

        newCollections.push({
          serviceId: service.id,
          cpuPercent: payload.metrics.cpu_percent,
          memoryGb: payload.metrics.memory_gb,
          diskGb: payload.metrics.disk_gb,
          networkGb: payload.metrics.network_gb, // NOTA: Certifique-se que 'networkGb' exista em 'NewCollection' (collections.schema.ts)
          energyKwh: energyKwh,
          co2Emissions: co2Emissions,
        } as NewCollection);

      } catch (error) {
        this.logger.warn(`Falha ao coletar métricas para o serviço ${service.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        continue;
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