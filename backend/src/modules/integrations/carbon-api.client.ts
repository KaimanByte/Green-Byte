import { BadGatewayException, Injectable } from '@nestjs/common';
import { ExternalHttpClient, requireBaseUrl } from './external-http.client';

/** Região, como a API GreenER de intensidade de carbono devolve em GET /regions. */
export interface ExternalRegion {
  code: string;
  country: string;
  region: string;
  city?: string | null;
  latitude: number;
  longitude: number;
  carbon_intensity_gco2e_per_kwh: number;
  renewable_share_percent: number;
}

/**
 * Cliente da API GreenER de intensidade de carbono (CARBON_API_BASE_URL).
 * Só sabe falar com a API e conferir o formato da resposta; gravar no banco
 * fica com o RegionsService.
 */
@Injectable()
export class CarbonApiClient {
  private readonly baseUrl: string;

  constructor(private readonly http: ExternalHttpClient) {
    this.baseUrl = requireBaseUrl('CARBON_API_BASE_URL');
  }

  /**
   * GET /regions — todas as regiões válidas. A lista inteira é validada antes de
   * devolver, para o banco não ficar com dados parciais se algum item vier inválido.
   */
  async listRegions(): Promise<ExternalRegion[]> {
    const payload = await this.http.getJson(`${this.baseUrl}/regions`, {
      messages: {
        timeout: 'A API externa de intensidade de carbono excedeu o tempo limite da requisição.',
        unavailable: 'Não foi possível conectar à API externa de intensidade de carbono.',
        httpError: () => 'A API externa de intensidade de carbono não conseguiu listar as regiões.',
        invalidJson: 'A API externa de intensidade de carbono retornou uma resposta JSON inválida.',
      },
    });

    if (
      typeof payload !== 'object' ||
      payload === null ||
      !Array.isArray((payload as Record<string, unknown>).regions)
    ) {
      throw new BadGatewayException(
        'A API externa de intensidade de carbono retornou uma lista de regiões em formato inválido.',
      );
    }

    return (payload as { regions: unknown[] }).regions.map((item: unknown) => {
      if (!this.isExternalRegion(item)) {
        throw new BadGatewayException(
          'A API externa de intensidade de carbono retornou uma região com campos inválidos.',
        );
      }
      return item;
    });
  }

  private isExternalRegion(value: unknown): value is ExternalRegion {
    if (typeof value !== 'object' || value === null) return false;

    const region = value as Record<string, unknown>;

    return (
      typeof region.code === 'string' &&
      region.code.length > 0 &&
      typeof region.country === 'string' &&
      typeof region.region === 'string' &&
      (typeof region.city === 'string' || region.city === null || region.city === undefined) &&
      this.isNumberInRange(region.latitude, -90, 90) &&
      this.isNumberInRange(region.longitude, -180, 180) &&
      this.isNumberInRange(region.carbon_intensity_gco2e_per_kwh, 0, Number.POSITIVE_INFINITY) &&
      this.isNumberInRange(region.renewable_share_percent, 0, 100)
    );
  }

  private isNumberInRange(value: unknown, min: number, max: number): boolean {
    return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
  }
}
