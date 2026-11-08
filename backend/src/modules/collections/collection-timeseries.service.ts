import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ServicesRepository } from '../services/services.repository';
import { CollectionsRepository, TimeSeriesRow } from './collections.repository';
import { HISTORY_UNITS } from './dto/history-summary.dto';
import {
  TimeSeriesCompareResponseDto,
  TimeSeriesPointDto,
  TimeSeriesResponseDto,
} from './dto/timeseries.dto';
import { resolvePeriod } from './period';

/** Intervalo de coleta do cron (StartupSyncService): não faz sentido agrupar em menos que isso. */
export const MIN_BUCKET_SECONDS = 30;
/** Teto de pontos por resposta, para o gráfico não receber milhares de pontos. */
export const MAX_BUCKETS = 1000;
/** Quantidade de pontos buscada quando `bucketSeconds` não é informado. */
export const DEFAULT_TARGET_BUCKETS = 120;

/** Teto de séries na comparação histórica: acima disso as linhas deixam de ser distinguíveis. */
export const MAX_COMPARE_SERIES = 10;

const REMOVED_STATUS = 'removed';

function toPointDto(row: TimeSeriesRow): TimeSeriesPointDto {
  return {
    timestamp: row.bucket.toISOString(),
    collectionsCount: row.collectionsCount,
    servicesCount: row.servicesCount,
    cpuPercent: row.cpuPercent,
    memoryGb: row.memoryGb,
    diskGb: row.diskGb,
    energyKwh: row.energyKwh,
    co2Emissions: row.co2Emissions,
  };
}

/** `bucketSeconds` ausente → undefined; precisa ser inteiro >= 30, senão 400. */
export function parseBucketSecondsParam(value?: string): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  if (!/^\d+$/.test(value) || Number(value) < MIN_BUCKET_SECONDS) {
    throw new BadRequestException(
      `Parâmetro "bucketSeconds" deve ser um inteiro maior ou igual a ${MIN_BUCKET_SECONDS}.`,
    );
  }
  return Number(value);
}

/** Tamanho automático: divide o período em ~120 intervalos, nunca menos de 30 s. */
export function resolveBucketSeconds(from: Date, to: Date, requested?: number): number {
  const rangeSeconds = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 1000));
  const bucketSeconds =
    requested ?? Math.max(MIN_BUCKET_SECONDS, Math.ceil(rangeSeconds / DEFAULT_TARGET_BUCKETS));

  if (Math.ceil(rangeSeconds / bucketSeconds) > MAX_BUCKETS) {
    throw new BadRequestException(
      `Período muito longo para "bucketSeconds"=${bucketSeconds}: o máximo é ${MAX_BUCKETS} intervalos.`,
    );
  }
  return bucketSeconds;
}

/**
 * Caso de uso de `GET /collections/timeseries`: evolução das métricas coletadas no tempo.
 * Usa as coletas individuais gravadas no banco e devolve a média por intervalo
 * (nunca a soma acumulada do período).
 */
@Injectable()
export class CollectionTimeSeriesService {
  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly collectionsRepository: CollectionsRepository,
  ) {}

  async getTimeSeries(
    from?: Date,
    to?: Date,
    serviceId?: string,
    bucketSecondsParam?: number,
  ): Promise<TimeSeriesResponseDto> {
    const period = resolvePeriod(from, to);
    const bucketSeconds = resolveBucketSeconds(period.from, period.to, bucketSecondsParam);

    if (serviceId) {
      const service = await this.servicesRepository.findById(serviceId);
      if (!service || service.status === REMOVED_STATUS) {
        throw new NotFoundException(`Serviço "${serviceId}" não encontrado.`);
      }
    }

    const rows = await this.collectionsRepository.getTimeSeries(
      period.from,
      period.to,
      bucketSeconds,
      serviceId,
    );

    return {
      serviceId: serviceId ?? null,
      period: { from: period.from.toISOString(), to: period.to.toISOString() },
      bucketSeconds,
      aggregation: 'avg',
      units: HISTORY_UNITS,
      total: rows.length,
      points: rows.map(toPointDto),
    };
  }

  /**
   * Caso de uso de `GET /collections/timeseries/compare`: uma série por serviço, todas no mesmo
   * período e com o mesmo `bucketSeconds`. Cada ponto é a média das coletas DAQUELE serviço no
   * intervalo — séries de serviços diferentes nunca são somadas nem acumuladas.
   * `ids` já chega validado (>= 2 distintos) por `parseCompareIds`.
   */
  async compareTimeSeries(
    ids: string[],
    from?: Date,
    to?: Date,
    bucketSecondsParam?: number,
  ): Promise<TimeSeriesCompareResponseDto> {
    if (ids.length > MAX_COMPARE_SERIES) {
      throw new BadRequestException(
        `Compare no máximo ${MAX_COMPARE_SERIES} serviços por vez no parâmetro "ids".`,
      );
    }

    const period = resolvePeriod(from, to);
    const bucketSeconds = resolveBucketSeconds(period.from, period.to, bucketSecondsParam);

    const services = await this.servicesRepository.findAll();
    const serviceById = new Map(services.map((service) => [service.id, service]));
    for (const id of ids) {
      const service = serviceById.get(id);
      if (!service || service.status === REMOVED_STATUS) {
        throw new NotFoundException(`Serviço "${id}" não encontrado.`);
      }
    }

    const rows = await this.collectionsRepository.getTimeSeriesByService(
      period.from,
      period.to,
      bucketSeconds,
      ids,
    );

    const rowsByService = new Map<string, TimeSeriesRow[]>(ids.map((id) => [id, []]));
    for (const row of rows) {
      rowsByService.get(row.serviceId)?.push(row);
    }

    const series = ids.map((id) => {
      const service = serviceById.get(id)!;
      // o banco já ordena por intervalo; reordenar aqui garante a ordem mesmo se a consulta mudar
      const points = (rowsByService.get(id) ?? [])
        .sort((a, b) => a.bucket.getTime() - b.bucket.getTime())
        .map(toPointDto);
      return {
        serviceId: service.id,
        name: service.name,
        regionCode: service.regionCode,
        total: points.length,
        points,
      };
    });

    return {
      period: { from: period.from.toISOString(), to: period.to.toISOString() },
      bucketSeconds,
      aggregation: 'avg',
      units: HISTORY_UNITS,
      total: series.length,
      series,
    };
  }
}
