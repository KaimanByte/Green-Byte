import { BadGatewayException, Injectable } from '@nestjs/common';
import { ExternalHttpClient, requireBaseUrl } from './external-http.client';

/** Localização de um serviço, como a API GreenER de métricas devolve em GET /services. */
export interface ExternalServiceLocation {
  region_code: string;
  country: string;
  region: string;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** Serviço monitorado, como a API GreenER de métricas devolve em GET /services. */
export interface ExternalService {
  id: string;
  name: string;
  location: ExternalServiceLocation;
  metrics_path?: string | null;
}

/** Uso de recursos de um serviço, como a API GreenER de métricas devolve em GET /metrics/:id. */
export interface ExternalServiceMetrics {
  collection_interval_seconds: number;
  metrics: {
    cpu_percent: number;
    memory_gb: number;
    disk_gb: number;
    network_gb: number;
  };
}

/**
 * Cliente da API GreenER de métricas (METRICS_API_BASE_URL).
 * Só sabe falar com a API e conferir o formato da resposta; gravar no banco
 * e calcular energia/CO₂e fica com os services.
 */
@Injectable()
export class MetricsApiClient {
  private readonly baseUrl: string;

  constructor(private readonly http: ExternalHttpClient) {
    this.baseUrl = requireBaseUrl('METRICS_API_BASE_URL');
  }

  /** GET /services — todos os serviços válidos, ou erro se algum vier com campos inválidos. */
  async listServices(): Promise<ExternalService[]> {
    const payload = await this.http.getJson(`${this.baseUrl}/services`, {
      messages: {
        timeout: 'A API externa de métricas excedeu o tempo limite da requisição.',
        unavailable: 'Não foi possível conectar à API externa de métricas.',
        httpError: () => 'A API externa de métricas não conseguiu listar os serviços.',
        invalidJson: 'A API externa de métricas retornou uma resposta JSON inválida.',
      },
    });

    if (!Array.isArray(payload)) {
      throw new BadGatewayException(
        'A API externa de métricas retornou uma lista de serviços em formato inválido.',
      );
    }

    // valida a lista inteira antes de devolver: nada é gravado se um item vier quebrado
    return payload.map((item: unknown) => {
      if (!this.isExternalService(item)) {
        throw new BadGatewayException(
          'A API externa de métricas retornou um serviço com campos inválidos.',
        );
      }
      return item;
    });
  }

  /** GET /metrics/:serviceId — uso de CPU, memória, disco e rede do serviço. */
  async getServiceMetrics(serviceId: string): Promise<ExternalServiceMetrics> {
    const payload = await this.http.getJson(`${this.baseUrl}/metrics/${serviceId}`, {
      messages: {
        timeout: `Timeout ao buscar métricas de ${serviceId}`,
        unavailable: `Indisponível para buscar métricas de ${serviceId}`,
        httpError: (status) => `Erro HTTP ${status} ao buscar métricas de ${serviceId}`,
        invalidJson: `Resposta JSON inválida ao buscar métricas de ${serviceId}`,
      },
    });

    return payload as ExternalServiceMetrics;
  }

  private isExternalService(value: unknown): value is ExternalService {
    if (typeof value !== 'object' || value === null) return false;

    const service = value as Record<string, unknown>;
    const location = service.location as Record<string, unknown> | null | undefined;

    if (typeof location !== 'object' || location === null) return false;

    return (
      typeof service.id === 'string' &&
      typeof service.name === 'string' &&
      typeof location.region_code === 'string' &&
      typeof location.country === 'string' &&
      typeof location.region === 'string' &&
      (typeof location.city === 'string' || location.city == null) &&
      this.isOptionalNumber(location.latitude) &&
      this.isOptionalNumber(location.longitude) &&
      (typeof service.metrics_path === 'string' || service.metrics_path == null)
    );
  }

  private isOptionalNumber(value: unknown): boolean {
    return value == null || (typeof value === 'number' && Number.isFinite(value));
  }
}
