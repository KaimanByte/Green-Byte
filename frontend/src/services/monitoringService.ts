import type { CollectionIntervalDto } from '../types/api'
import { request, type RequestOptions } from './api'

/** GET /monitoring/collection-interval — não expõe os detalhes administrativos da coleta. */
export function getCollectionInterval(options?: RequestOptions): Promise<CollectionIntervalDto> {
  return request<CollectionIntervalDto>('/monitoring/collection-interval', options)
}
