import { useCallback } from 'react'
import { compareServices } from '../services/indicatorsService'
import type { CompareDto } from '../types/api'
import { useFetch, type UseFetchResult } from './useFetch'
import { useGreenData } from './useGreenData'

/**
 * Comparação oficial do backend (GET /compare) entre os serviços escolhidos,
 * na mesma janela da última sincronização. Com menos de 2 ids não chama a API
 * (o backend responderia 400) e devolve `null`.
 */
export function useCompare(ids: string[]): UseFetchResult<CompareDto | null> {
  const { period } = useGreenData()
  const startMs = period.start.getTime()
  const endMs = period.end.getTime()
  const key = ids.join(',')

  const fetcher = useCallback(
    async (signal: AbortSignal) => {
      const list = key ? key.split(',') : []
      if (list.length < 2) return null
      return compareServices(list, { start: new Date(startMs), end: new Date(endMs) }, { signal })
    },
    [key, startMs, endMs],
  )

  return useFetch(fetcher)
}
