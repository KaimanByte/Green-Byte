import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicesRepository } from './services.repository';
import { ServiceResponseDto, SyncServicesResponseDto } from './dto/service.dto';
import { Service, NewService } from './services.schema';
import { MetricsApiClient } from '../integrations/metrics-api.client';

@Injectable()
export class ServicesService {
  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly metricsApi: MetricsApiClient,
  ) {}

  async findAllServices(): Promise<ServiceResponseDto[]> {
    const result = await this.syncServices();
    return result.services;
  }

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

    return { total: saved.length, services: dtos };
  }

  async findById(id: string): Promise<Service> {
    const service = await this.servicesRepository.findById(id);
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }
}
