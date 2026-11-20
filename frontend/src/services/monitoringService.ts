import { DEFAULT_POLL_INTERVAL_MS, resolvePollIntervalMs } from '../lib/polling'
import type { CollectionHealthDto } from '../types/api'
import { request, type RequestOptions } from './api'

/** GET /settings/collection-health */
export function getCollectionHealth(options?: RequestOptions): Promise<CollectionHealthDto> {
  return request<CollectionHealthDto>('/settings/collection-health', options)
}

/**
 * Consulta o intervalo efetivo de coleta e devolve o período de polling em ms (teto de 60 s).
 * Em caso de falha na consulta, preserva o fallback seguro sem derrubar o dashboard.
 */
export async function fetchSafePollIntervalMs(
  fallbackMs: number = DEFAULT_POLL_INTERVAL_MS,
  options?: RequestOptions,
): Promise<number> {
  try {
    const health = await getCollectionHealth(options)
    const candidateSeconds =
      typeof health?.effectiveIntervalSeconds === 'number'
        ? health.effectiveIntervalSeconds
        : health?.recommendedPollSeconds
    return resolvePollIntervalMs(candidateSeconds, fallbackMs)
  } catch {
    return resolvePollIntervalMs(undefined, fallbackMs)
  }
}
