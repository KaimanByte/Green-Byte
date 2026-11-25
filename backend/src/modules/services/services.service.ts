import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CollectionResult, ServicesRepository, ServiceWithLocation } from './services.repository';
import { ServiceResponseDto, SyncServicesResponseDto } from './dto/service.dto';
import { Service, NewService } from './services.schema';
import { MetricsApiClient } from '../integrations/metrics-api.client';

function toResponseDto(row: ServiceWithLocation): ServiceResponseDto {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    regionCode: row.regionCode,
    location: {
      country: row.country ?? '',
      region: row.regionName ?? '',
      city: row.city,
      latitude: row.latitude,
      longitude: row.longitude,
    },
    // o caminho de métricas não é guardado no banco; a coleta usa /metrics/{id} pelo cliente da API
    metricsPath: null,
  };
}

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly metricsApi: MetricsApiClient,
  ) {}

  /**
   * Serviços monitorados, lidos do NOSSO banco: a API de métricas só alimenta o banco (no ciclo
   * de sincronização), então a lista continua disponível mesmo com a API externa fora do ar.
   * Só com o banco vazio (primeira execução) tenta buscar na API para não começar sem nada.
   */
  async findAllServices(): Promise<ServiceResponseDto[]> {
    const rows = await this.servicesRepository.findActiveWithLocation();
    if (rows.length > 0) return rows.map(toResponseDto);

    const result = await this.syncServices();
    return result.services;
  }

  /**
   * Alimenta o banco com a lista da API de métricas: insere ou atualiza cada serviço e marca
   * como removido quem não veio mais na lista (sem apagar, por causa do histórico).
   */
  async syncServices(): Promise<SyncServicesResponseDto> {
    // a lista já chega validada pelo cliente: se um item vier inválido, nada é gravado
    const externalServices = await this.metricsApi.listServices();

    const dtos: ServiceResponseDto[] = [];
    const dbRecords: NewService[] = [];

    for (const item of externalServices) {
      dtos.push({
        id: item.id,
        name: item.name,
        status: 'registered',
        regionCode: item.location.region_code,
        location: {
          country: item.location.country,
          region: item.location.region,
          city: item.location.city ?? null,
          latitude: item.location.latitude ?? null,
          longitude: item.location.longitude ?? null,
        },
        metricsPath: item.metrics_path ?? null,
      });

      dbRecords.push({
        id: item.id,
        name: item.name,
        regionCode: item.location.region_code,
        status: 'registered',
      });
    }

    const saved =
      dbRecords.length > 0
        ? await this.servicesRepository.upsertMany(dbRecords)
        : [];

    // lista vazia não remove ninguém: uma resposta vazia por instabilidade não pode apagar o painel
    if (dbRecords.length > 0) {
      const removed = await this.servicesRepository.markRemovedExcept(dbRecords.map((record) => record.id));
      if (removed.length > 0) {
        this.logger.log(`Serviços que saíram da API de métricas: ${removed.map((service) => service.id).join(', ')}.`);
      }
    }

    return { total: saved.length, services: dtos };
  }

  /** Guarda como foi a coleta de cada serviço no ciclo (base do estado mostrado no painel). */
  async recordCollectionResults(results: CollectionResult[]): Promise<void> {
    await this.servicesRepository.recordCollectionResults(results);
  }

  async findById(id: string): Promise<Service> {
    const service = await this.servicesRepository.findById(id);
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }
}
