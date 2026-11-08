import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RegionsRepository } from './regions.repository';
import { NewRegion, Region } from './regions.schema';
import { RegiaoResponseDto } from './dto/regiao-response.dto';
import { SincronizacaoRegioesResponseDto } from './dto/sincronizacao-regioes-response.dto';
import { CarbonApiClient, ExternalRegion } from '../integrations/carbon-api.client';

@Injectable()
export class RegionsService {
  private readonly logger = new Logger(RegionsService.name);

  constructor(
    private readonly regionsRepository: RegionsRepository,
    private readonly carbonApi: CarbonApiClient,
  ) {}

  async findAllRegions(): Promise<RegiaoResponseDto[]> {
    const regions = await this.regionsRepository.findAll();
    
    // Correção: Retorna os dados recém-sincronizados caso o banco estivesse vazio
    if (regions.length === 0) {
      const syncedRegions = await this.syncRegions();
      return syncedRegions.regioes;
    }
    
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
   * Busca as regiões na API Greener Carbon Intensity e grava (upsertMany) no banco.
   * O CarbonApiClient valida todas as regiões antes de devolver, para não deixar
   * o banco com dados parciais quando a API externa devolver algo inválido.
   */
  async syncRegions(): Promise<SincronizacaoRegioesResponseDto> {
    const externalRegions = await this.carbonApi.listRegions();

    if (externalRegions.length === 0) {
      this.logger.warn('A API externa de carbono retornou zero regiões.');
      return { total: 0, regioes: [] };
    }

    // Otimização: Mapeia tudo e salva em lote (Batch Insert/Update) usando upsertMany
    const newRegions: NewRegion[] = externalRegions.map((ext) => this.toNewRegion(ext));
    const saved = await this.regionsRepository.upsertMany(newRegions);

    return {
      total: saved.length,
      regioes: saved.map((region) => this.toResponse(region)),
    };
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
      regionCode: region.regionCode,
      country: region.country,
      region: region.regionName,
      city: region.city ?? null,
      latitude: region.latitude,
      longitude: region.longitude,
      carbonIntensity: region.carbonIntensity,
      renewableSharePercent: region.renewableSharePercent,
    };
  }
}
