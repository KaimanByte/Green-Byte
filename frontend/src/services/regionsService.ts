import type { RegionDto } from '../types/api'
import { request, type RequestOptions } from './api'

/** GET /regions */
export function getRegions(options?: RequestOptions): Promise<RegionDto[]> {
  return request<RegionDto[]>('/regions', options)
}

/** GET /regions/:codigoRegiao */
export function getRegionByCode(regionCode: string, options?: RequestOptions): Promise<RegionDto> {
  return request<RegionDto>(`/regions/${encodeURIComponent(regionCode)}`, options)
}
