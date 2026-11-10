import { useCallback } from 'react'
import { getRanking } from '../services/indicatorsService'
import type { RankingDto, RankingMetric } from '../types/api'
import { useFetch, type UseFetchResult } from './useFetch'
import { useGreenData } from './useGreenData'

/**
 * Ranking oficial do backend (GET /ranking) para a métrica escolhida, na mesma janela
 * da última sincronização do provider. Refaz a busca quando o provider sincroniza.
 */
export function useRanking(metric: RankingMetric): UseFetchResult<RankingDto> {
  const { period } = useGreenData()
  const startMs = period.start.getTime()
  const endMs = period.end.getTime()

  const fetcher = useCallback(
    (signal: AbortSignal) =>
      getRanking(metric, { start: new Date(startMs), end: new Date(endMs) }, { signal }),
    [metric, startMs, endMs],
  )

  return useFetch(fetcher)
}
