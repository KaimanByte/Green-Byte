import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ServicesRepository } from './services.repository';
import { ServiceResponseDto } from './dto/service.dto';
import { Service, NewService } from './services.schema';

interface ExternalServiceLocation {
  region_code: string;
  country: string;
  region: string;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface ExternalService {
  id: string;
  name: string;
  location: ExternalServiceLocation;
  metrics_path?: string | null;
}

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);
  private readonly servicesUrl: string;
  private readonly requestTimeoutMs = 5000;

  constructor(private readonly servicesRepository: ServicesRepository) {
    const baseUrl = process.env.METRICS_API_BASE_URL || 'https://metrics.unilaunch.org';
    this.servicesUrl = `${baseUrl.replace(/\/+$/, '')}/services`;
  }

  async findAllServices(): Promise<ServiceResponseDto[]> {
    const payload = await this.fetchServices();

    if (!Array.isArray(payload)) {
      throw new BadGatewayException(
        'A API externa de métricas retornou uma lista de serviços em formato inválido.',
      );
    }

    const dtos: ServiceResponseDto[] = [];
    const dbRecords: NewService[] = [];

    for (const item of payload) {
      if (!this.isExternalService(item)) {
        throw new BadGatewayException(
          'A API externa de métricas retornou um serviço com campos inválidos.',
        );
      }

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

    if (dbRecords.length > 0) {
      this.servicesRepository.upsertMany(dbRecords).catch(err => 
        this.logger.error('Falha ao sincronizar serviços com o banco de dados local', err.stack)
      );
    }

    return dtos;
  }

  async findById(id: string): Promise<Service> {
    const service = await this.servicesRepository.findById(id);
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }

  private async fetchServices(): Promise<unknown> {
    let response: Response;

    try {
      response = await fetch(this.servicesUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.requestTimeoutMs),
      });
    } catch (error: unknown) {
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new GatewayTimeoutException('A API externa de métricas excedeu o tempo limite da requisição.');
      }
      this.logger.error('Não foi possível conectar à API externa de métricas.', error instanceof Error ? error.stack : undefined);
      throw new ServiceUnavailableException('Não foi possível conectar à API externa de métricas.');
    }

    if (!response.ok) {
      this.logger.warn(`A API externa de métricas respondeu com HTTP ${response.status}.`);
      throw new BadGatewayException('A API externa de métricas não conseguiu listar os serviços.');
    }

    try {
      return await response.json();
    } catch {
      throw new BadGatewayException('A API externa de métricas retornou uma resposta JSON inválida.');
    }
  }

  private isExternalService(value: unknown): value is ExternalService {
    if (typeof value !== 'object' || value === null) return false;

    const s = value as Record<string, any>;
    const loc = s.location;

    if (typeof loc !== 'object' || loc === null) return false;

    return (
      typeof s.id === 'string' &&
      typeof s.name === 'string' &&
      typeof loc.region_code === 'string' &&
      typeof loc.country === 'string' &&
      typeof loc.region === 'string' &&
      (typeof loc.city === 'string' || loc.city == null) &&
      this.isOptionalNumber(loc.latitude) &&
      this.isOptionalNumber(loc.longitude) &&
      (typeof s.metrics_path === 'string' || s.metrics_path == null)
    );
  }

  private isOptionalNumber(value: unknown): boolean {
    return value == null || (typeof value === 'number' && Number.isFinite(value));
  }
}