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

    const problem = this.findMetricsProblem(payload);
    if (problem) {
      throw new BadGatewayException(`Métricas de ${serviceId} em formato inválido: ${problem}.`);
    }

    return payload as ExternalServiceMetrics;
  }

  /**
   * Confere o JSON de GET /metrics/:id antes de qualquer cálculo: sem isso, um campo
   * ausente ou texto vira NaN em energia/CO₂e e vai parar no banco.
   * Devolve a descrição do primeiro problema encontrado, ou null se estiver tudo certo.
   */
  private findMetricsProblem(value: unknown): string | null {
    if (typeof value !== 'object' || value === null) return 'a resposta não é um objeto';

    const payload = value as Record<string, unknown>;
    if (!this.isNumberInRange(payload.collection_interval_seconds, 0, Number.POSITIVE_INFINITY, false)) {
      return '"collection_interval_seconds" deve ser um número maior que zero';
    }

    const metrics = payload.metrics as Record<string, unknown> | null | undefined;
    if (typeof metrics !== 'object' || metrics === null) return '"metrics" ausente';

    if (!this.isNumberInRange(metrics.cpu_percent, 0, 100)) {
      return '"metrics.cpu_percent" deve ser um número entre 0 e 100';
    }
    for (const field of ['memory_gb', 'disk_gb', 'network_gb'] as const) {
      if (!this.isNumberInRange(metrics[field], 0, Number.POSITIVE_INFINITY)) {
        return `"metrics.${field}" deve ser um número maior ou igual a zero`;
      }
    }

    return null;
  }

  /** Número finito dentro de [min, max] (ou (min, max] quando `includeMin` é false). */
  private isNumberInRange(value: unknown, min: number, max: number, includeMin = true): boolean {
    return (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      (includeMin ? value >= min : value > min) &&
      value <= max
    );
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
