import type {
  CollectionDto,
  EmissionsPeriod,
  RegionEmissionsDto,
  ServiceEmissionsDto,
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
