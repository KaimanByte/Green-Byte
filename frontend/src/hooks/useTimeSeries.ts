import { useCallback } from 'react'
import { PERIOD_OPTIONS, getPeriodOption } from '../lib/periods'
import { compareTimeSeries, getTimeSeries } from '../services/collectionsService'
import type { TimeSeriesCompareDto, TimeSeriesDto } from '../types/api'
import { useFetch, type UseFetchResult } from './useFetch'
import { useGreenData } from './useGreenData'

/** Máximo de serviços aceito por GET /collections/timeseries/compare. */
export const MAX_COMPARE_SERIES = 10

/**
 * Janela da última sincronização do provider + tamanho do intervalo dos pontos.
 * O tamanho do intervalo segue a janela realmente buscada (e não o filtro recém-clicado),
 * senão "30 dias" com intervalos de 1 min passaria do limite do backend até o provider atualizar.
 */
function useSeriesWindow() {
  const { period, periodId } = useGreenData()
  const startMs = period.start.getTime()
  const endMs = period.end.getTime()
  const { bucketSeconds } =
    PERIOD_OPTIONS.find((option) => Math.abs(option.durationMs - (endMs - startMs)) < 60_000) ??
    getPeriodOption(periodId)
  return { startMs, endMs, bucketSeconds }
}

/**
 * Evolução das métricas (GET /collections/timeseries) no período do filtro,
 * para todos os serviços ou um só. Usa a mesma janela da última sincronização do provider,
 * então acompanha a atualização automática e a troca de período.
 */
export function useTimeSeries(serviceId?: string): UseFetchResult<TimeSeriesDto> {
  const { startMs, endMs, bucketSeconds } = useSeriesWindow()

  const fetcher = useCallback(
    (signal: AbortSignal) =>
      getTimeSeries(
        { start: new Date(startMs), end: new Date(endMs) },
        { serviceId, bucketSeconds },
        { signal },
      ),
    [startMs, endMs, serviceId, bucketSeconds],
  )

  return useFetch(fetcher)
}

/**
 * Comparação histórica (GET /collections/timeseries/compare): uma série por serviço, todas
 * na mesma janela e com o mesmo intervalo do gráfico de evolução. Fora da faixa de 2 a
 * MAX_COMPARE_SERIES serviços não chama a API (o backend responderia 400) e devolve `null`.
 */
export function useCompareTimeSeries(ids: string[]): UseFetchResult<TimeSeriesCompareDto | null> {
  const { startMs, endMs, bucketSeconds } = useSeriesWindow()
  const key = ids.join(',')

  const fetcher = useCallback(
    async (signal: AbortSignal) => {
      const list = key ? key.split(',') : []
      if (list.length < 2 || list.length > MAX_COMPARE_SERIES) return null
      return compareTimeSeries(list, { start: new Date(startMs), end: new Date(endMs) }, { bucketSeconds }, { signal })
    },
    [key, startMs, endMs, bucketSeconds],
  )

  return useFetch(fetcher)
}
