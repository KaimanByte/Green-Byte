import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RegionsRepository } from './regions.repository';
import { NewRegion, Region } from './regions.schema';
import { RegiaoResponseDto } from './dto/regiao-response.dto';
import { SincronizacaoRegioesResponseDto } from './dto/sincronizacao-regioes-response.dto';

interface ExternalRegion {
  code: string;
  country: string;
  region: string;
  city?: string | null;
  latitude: number;
  longitude: number;
  carbon_intensity_gco2e_per_kwh: number;
  renewable_share_percent: number;
}

@Injectable()
export class RegionsService {
  private readonly logger = new Logger(RegionsService.name);
  private readonly regionsUrl: string;
  private readonly requestTimeoutMs = 5_000;

  constructor(private readonly regionsRepository: RegionsRepository) {
    const baseUrl =
      process.env.CARBON_API_BASE_URL || 'https://carbon.unilaunch.org';
    this.regionsUrl = `${baseUrl.replace(/\/+$/, '')}/regions`;
  }

  async findAllRegions(): Promise<RegiaoResponseDto[]> {
    const regions = await this.regionsRepository.findAll();
    return regions.map((region) => this.toResponse(region));
  }

  async findRegionByCode(codigoRegiao: string): Promise<RegiaoResponseDto> {
    const region = await this.regionsRepository.findByCode(codigoRegiao);

    if (!region) {
      throw new NotFoundException(`Região '${codigoRegiao}' não encontrada.`);
    }

    return this.toResponse(region);
  }

  /**
   * Busca as regiões na API Greener Carbon Intensity e grava (upsert) no banco.
   * Todas as regiões são validadas antes da primeira gravação, para não deixar
   * o banco com dados parciais quando a API externa devolver algo inválido.
   */
  async syncRegions(): Promise<SincronizacaoRegioesResponseDto> {
    const payload = await this.fetchRegions();

    if (
      typeof payload !== 'object' ||
      payload === null ||
      !Array.isArray((payload as Record<string, unknown>).regions)
    ) {
      throw new BadGatewayException(
        'A API externa de intensidade de carbono retornou uma lista de regiões em formato inválido.',
      );
    }

    const externalRegions = (payload as { regions: unknown[] }).regions.map(
      (item: unknown) => {
        if (!this.isExternalRegion(item)) {
          throw new BadGatewayException(
            'A API externa de intensidade de carbono retornou uma região com campos inválidos.',
          );
        }
        return item;
      },
    );

    if (externalRegions.length === 0) {
      this.logger.warn('A API externa de carbono retornou zero regiões.');
    }

    const saved: Region[] = [];
    for (const external of externalRegions) {
      saved.push(await this.regionsRepository.upsert(this.toNewRegion(external)));
    }

    return {
      total: saved.length,
      regioes: saved.map((region) => this.toResponse(region)),
    };
  }

  private async fetchRegions(): Promise<unknown> {
    let response: Response;

    try {
      response = await fetch(this.regionsUrl, {
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
          'A API externa de intensidade de carbono excedeu o tempo limite da requisição.',
        );
      }

      this.logger.error(
        'Não foi possível conectar à API externa de intensidade de carbono.',
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException(
        'Não foi possível conectar à API externa de intensidade de carbono.',
      );
    }

    if (!response.ok) {
      this.logger.warn(
        `A API externa de intensidade de carbono respondeu com HTTP ${response.status}.`,
      );
      throw new BadGatewayException(
        'A API externa de intensidade de carbono não conseguiu listar as regiões.',
      );
    }

    try {
      return await response.json();
    } catch {
      throw new BadGatewayException(
        'A API externa de intensidade de carbono retornou uma resposta JSON inválida.',
      );
    }
  }

  private toNewRegion(external: ExternalRegion): NewRegion {
    return {
      regionCode: external.code,
      country: external.country,
      regionName: external.region,
      city: external.city ?? null,
      latitude: external.latitude,
      longitude: external.longitude,
      carbonIntensity: external.carbon_intensity_gco2e_per_kwh,
      renewableSharePercent: external.renewable_share_percent,
    };
  }

  private toResponse(region: Region): RegiaoResponseDto {
    return {
      codigoRegiao: region.regionCode,
      pais: region.country,
      regiao: region.regionName,
      cidade: region.city ?? null,
      latitude: region.latitude,
      longitude: region.longitude,
      intensidadeCarbono: region.carbonIntensity,
      percentualRenovavel: region.renewableSharePercent,
    };
  }

  private isExternalRegion(value: unknown): value is ExternalRegion {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const region = value as Record<string, unknown>;

    return (
      typeof region.code === 'string' &&
      region.code.length > 0 &&
      typeof region.country === 'string' &&
      typeof region.region === 'string' &&
      (typeof region.city === 'string' ||
        region.city === null ||
        region.city === undefined) &&
      this.isNumberInRange(region.latitude, -90, 90) &&
      this.isNumberInRange(region.longitude, -180, 180) &&
      this.isNumberInRange(
        region.carbon_intensity_gco2e_per_kwh,
        0,
        Number.POSITIVE_INFINITY,
      ) &&
      this.isNumberInRange(region.renewable_share_percent, 0, 100)
    );
  }

  private isNumberInRange(value: unknown, min: number, max: number): boolean {
    return (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= min &&
      value <= max
    );
  }
}
