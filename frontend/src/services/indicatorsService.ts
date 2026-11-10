import type { CompareDto, EmissionsPeriod, RankingDto, RankingMetric, SummaryDto } from '../types/api'
import { request, type RequestOptions } from './api'

// Endpoints de indicadores consolidados (backend: SummaryController e RankingCompareController).
// Todos aceitam `from`/`to` (ISO 8601); sem eles o backend usa as últimas 24 h.

/** GET /summary?from=&to= */
export function getSummary(period: EmissionsPeriod, options?: RequestOptions): Promise<SummaryDto> {
  return request<SummaryDto>('/summary', {
    ...options,
    query: { from: period.start, to: period.end },
  })
}

/** GET /ranking?metric=&from=&to= */
export function getRanking(
  metric: RankingMetric,
  period: EmissionsPeriod,
  options?: RequestOptions,
): Promise<RankingDto> {
  return request<RankingDto>('/ranking', {
    ...options,
    query: { metric, from: period.start, to: period.end },
  })
}

/** GET /compare?ids=a,b&from=&to= (mínimo de 2 ids distintos) */
export function compareServices(
  ids: string[],
  period: EmissionsPeriod,
  options?: RequestOptions,
): Promise<CompareDto> {
  return request<CompareDto>('/compare', {
    ...options,
    query: { ids: ids.join(','), from: period.start, to: period.end },
  })
}
