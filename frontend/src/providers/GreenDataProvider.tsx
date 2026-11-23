import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { GreenDataContext, type GreenDataContextValue } from '../contexts/GreenDataContext'
import { useFetch } from '../hooks/useFetch'
import { getDashboardData, type DashboardData } from '../services/dashboardService'
import { DEFAULT_PERIOD_ID, getPeriodRange, type PeriodId } from '../lib/periods'
import { dashboardRefreshIntervalMs, subscribeToCollectionIntervalChanged } from '../lib/collectionRefresh'
import type { EmissionsPeriod } from '../types/api'

type DashboardResult = DashboardData & { period: EmissionsPeriod }

/**
 * Busca os dados do backend uma única vez e os compartilha com todo o app,
 * evitando que cada componente dispare suas próprias requisições.
 */
export function GreenDataProvider({ children }: { children: ReactNode }) {
  const [periodId, setPeriodIdState] = useState<PeriodId>(DEFAULT_PERIOD_ID)
  const [collectionIntervalSeconds, setCollectionIntervalSeconds] = useState<number | null>(null)

  // a janela é calculada a cada busca (inclusive no refetch), sempre terminando "agora"
  const fetcher = useCallback(
    async (signal: AbortSignal): Promise<DashboardResult> => {
      const period = getPeriodRange(periodId)
      const data = await getDashboardData(signal, period)
      return { ...data, period }
    },
    [periodId],
  )

  const { data, loading, error, refetch, updatedAt } = useFetch(fetcher)

  // Cada resposta que traz o intervalo confirma o valor efetivo no backend. O ajuste é feito
  // durante a renderização (e não num efeito) para não causar uma renderização extra; se a
  // fonte falhar (null), o último intervalo conhecido continua valendo.
  const fetchedIntervalSeconds = data?.collectionIntervalSeconds ?? null
  const [lastFetchedIntervalSeconds, setLastFetchedIntervalSeconds] = useState<number | null>(null)
  if (fetchedIntervalSeconds !== null && fetchedIntervalSeconds !== lastFetchedIntervalSeconds) {
    setLastFetchedIntervalSeconds(fetchedIntervalSeconds)
    setCollectionIntervalSeconds(fetchedIntervalSeconds)
  }

  const refreshIntervalMs = dashboardRefreshIntervalMs(collectionIntervalSeconds)

  // Uma alteração salva no painel administrativo reprograma o polling desta aba imediatamente.
  useEffect(() => subscribeToCollectionIntervalChanged(setCollectionIntervalSeconds), [])

  // trocar o período mostra "carregando" na hora (o refetch e a troca do fetcher caem no mesmo render)
  const setPeriodId = useCallback(
    (id: PeriodId) => {
      setPeriodIdState(id)
      refetch()
    },
    [refetch],
  )

  // atualização periódica só com a aba visível; volta a atualizar ao reabrir a aba
  useEffect(() => {
    let timer = 0
    const schedule = () => {
      window.clearInterval(timer)
      if (document.visibilityState === 'visible') timer = window.setInterval(refetch, refreshIntervalMs)
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refetch()
      schedule()
    }

    schedule()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [refetch, refreshIntervalMs])

  const value = useMemo<GreenDataContextValue>(() => {
    const latestCollections = data?.latestCollections ?? []
    const lastCollectionMs = latestCollections.reduce((max, collection) => {
      const time = new Date(collection.timestamp).getTime()
      return Number.isFinite(time) ? Math.max(max, time) : max
    }, 0)

    return {
      regions: data?.regions ?? [],
      services: data?.services ?? [],
      emissions: data?.emissions ?? [],
      serviceEmissions: data?.serviceEmissions ?? [],
      latestCollections,
      lastCollectionAt: lastCollectionMs > 0 ? new Date(lastCollectionMs) : null,
      summary: data?.summary ?? null,
      loading,
      error,
      failedSources: data?.failedSources ?? [],
      refetch,
      lastSync: updatedAt,
      periodId,
      setPeriodId,
      period: data?.period ?? getPeriodRange(periodId),
    }
  }, [data, loading, error, refetch, updatedAt, periodId, setPeriodId])

  return <GreenDataContext.Provider value={value}>{children}</GreenDataContext.Provider>
}
