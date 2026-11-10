import type {
  CollectionDto,
  EmissionsPeriod,
  RegionEmissionsDto,
  ServiceEmissionsDto,
  TimeSeriesCompareDto,
  TimeSeriesDto,
} from '../types/api'
import { request, type RequestOptions } from './api'

const HOUR_MS = 3_600_000

/** Período padrão do dashboard ("Últimas 24 h"), terminando agora. */
export function getLast24Hours(): EmissionsPeriod {
  const end = new Date()
  return { start: new Date(end.getTime() - 24 * HOUR_MS), end }
}

/** GET /collections/emissions/region?start=&end= */
export function getEmissionsByRegion(
  period: EmissionsPeriod = getLast24Hours(),
  options?: RequestOptions,
): Promise<RegionEmissionsDto[]> {
  return request<RegionEmissionsDto[]>('/collections/emissions/region', {
    ...options,
    query: { start: period.start, end: period.end },
  })
}

/** GET /collections/emissions/service?start=&end= */
export function getEmissionsByService(
  period: EmissionsPeriod = getLast24Hours(),
  options?: RequestOptions,
): Promise<ServiceEmissionsDto[]> {
  return request<ServiceEmissionsDto[]>('/collections/emissions/service', {
    ...options,
    query: { start: period.start, end: period.end },
  })
}

/**
 * GET /collections/timeseries?from=&to=&serviceId=&bucketSeconds=
 * Evolução das métricas: média das coletas gravadas em cada intervalo (não é soma acumulada).
 * Sem `serviceId`, considera todos os serviços.
 */
export function getTimeSeries(
  period: EmissionsPeriod,
  params: { serviceId?: string; bucketSeconds?: number } = {},
  options?: RequestOptions,
): Promise<TimeSeriesDto> {
  return request<TimeSeriesDto>('/collections/timeseries', {
    ...options,
    query: {
      from: period.start,
      to: period.end,
      serviceId: params.serviceId,
      bucketSeconds: params.bucketSeconds,
    },
  })
}

/**
 * GET /collections/timeseries/compare — uma série por serviço (2 a 10), todas com o mesmo período
 * e `bucketSeconds`. Cada ponto é a média das coletas daquele serviço no intervalo.
 */
export function compareTimeSeries(
  ids: string[],
  period: EmissionsPeriod,
  params: { bucketSeconds?: number } = {},
  options?: RequestOptions,
): Promise<TimeSeriesCompareDto> {
  return request<TimeSeriesCompareDto>('/collections/timeseries/compare', {
    ...options,
    query: {
      ids: ids.join(','),
      from: period.start,
      to: period.end,
      bucketSeconds: params.bucketSeconds,
    },
  })
}

/** GET /collections/service/:serviceId?limit= */
export function getCollectionsByService(
  serviceId: string,
  limit?: number,
  options?: RequestOptions,
): Promise<CollectionDto[]> {
  return request<CollectionDto[]>(`/collections/service/${encodeURIComponent(serviceId)}`, {
    ...options,
    query: { limit },
  })
}
