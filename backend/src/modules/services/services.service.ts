import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ServicoResponseDto } from './dto/servico-response.dto';

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
  private readonly requestTimeoutMs = 5_000;

  constructor() {
    const baseUrl =
      process.env.METRICS_API_BASE_URL || 'https://metrics.unilaunch.org';
    this.servicesUrl = `${baseUrl.replace(/\/+$/, '')}/services`;
  }

  async findAllServices(): Promise<ServicoResponseDto[]> {
    const payload = await this.fetchServices();

    if (!Array.isArray(payload)) {
      throw new BadGatewayException(
        'A API externa de métricas retornou uma lista de serviços em formato inválido.',
      );
    }

    return payload.map((item: unknown) => {
      if (!this.isExternalService(item)) {
        throw new BadGatewayException(
          'A API externa de métricas retornou um serviço com campos inválidos.',
        );
      }

      return {
        id: item.id,
        nome: item.name,
        // A API externa lista os serviços registrados, mas não informa o estado
        // de saúde operacional. Por isso, não os classificamos como "ativos".
        status: 'registrado',
        localizacao: {
          codigoRegiao: item.location.region_code,
          pais: item.location.country,
          regiao: item.location.region,
          cidade: item.location.city ?? null,
          latitude: item.location.latitude ?? null,  
          longitude: item.location.longitude ?? null,
        },
        caminhoMetricas: item.metrics_path ?? null,
      };
    });
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
      if (
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new GatewayTimeoutException(
          'A API externa de métricas excedeu o tempo limite da requisição.',
        );
      }

      this.logger.error(
        'Não foi possível conectar à API externa de métricas.',
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException(
        'Não foi possível conectar à API externa de métricas.',
      );
    }

    if (!response.ok) {
      this.logger.warn(
        `A API externa de métricas respondeu com HTTP ${response.status}.`,
      );
      throw new BadGatewayException(
        'A API externa de métricas não conseguiu listar os serviços.',
      );
    }

    try {
      return await response.json();
    } catch {
      throw new BadGatewayException(
        'A API externa de métricas retornou uma resposta JSON inválida.',
      );
    }
  }

  private isExternalService(value: unknown): value is ExternalService {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const service = value as Record<string, unknown>;
    const location = service.location;

    if (typeof location !== 'object' || location === null) {
      return false;
    }

    const serviceLocation = location as Record<string, unknown>;

        return (
      typeof service.id === 'string' &&
      typeof service.name === 'string' &&
      typeof serviceLocation.region_code === 'string' &&
      typeof serviceLocation.country === 'string' &&
      typeof serviceLocation.region === 'string' &&
      (typeof serviceLocation.city === 'string' ||
        serviceLocation.city === null ||
        serviceLocation.city === undefined) &&
      this.isOptionalNumber(serviceLocation.latitude) &&
      this.isOptionalNumber(serviceLocation.longitude) &&
      (typeof service.metrics_path === 'string' ||
        service.metrics_path === null ||
        service.metrics_path === undefined)
    );
  }

  private isOptionalNumber(value: unknown): boolean {
    return (
      value === null ||
      value === undefined ||
      (typeof value === 'number' && Number.isFinite(value))
    );
  }
}
