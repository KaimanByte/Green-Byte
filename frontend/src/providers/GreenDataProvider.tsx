import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { GreenDataContext, type GreenDataContextValue } from '../contexts/GreenDataContext'
import { useFetch } from '../hooks/useFetch'
import { DEFAULT_POLL_INTERVAL_MS } from '../lib/polling'
import { DEFAULT_PERIOD_ID, getPeriodRange, type PeriodId } from '../lib/periods'
import { getDashboardData, type DashboardData } from '../services/dashboardService'
import { fetchSafePollIntervalMs } from '../services/monitoringService'
import type { EmissionsPeriod } from '../types/api'

type DashboardResult = DashboardData & { period: EmissionsPeriod }

/**
 * Busca os dados do backend uma única vez e os compartilha com todo o app,
 * acompanhando dinamicamente o intervalo efetivo da coleta (limitado a 60 s).
 */
export function GreenDataProvider({ children }: { children: ReactNode }) {
  const [periodId, setPeriodIdState] = useState<PeriodId>(DEFAULT_PERIOD_ID)
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(DEFAULT_POLL_INTERVAL_MS)
  const pollIntervalMsRef = useRef<number>(DEFAULT_POLL_INTERVAL_MS)

  useEffect(() => {
    pollIntervalMsRef.current = pollIntervalMs
  }, [pollIntervalMs])

  // a janela é calculada a cada busca (inclusive no refetch), sempre terminando "agora"
  const fetcher = useCallback(
    async (signal: AbortSignal): Promise<DashboardResult> => {
      const period = getPeriodRange(periodId)
      const [data, nextPollMs] = await Promise.all([
        getDashboardData(signal, period),
        fetchSafePollIntervalMs(pollIntervalMsRef.current, { signal }),
      ])
      if (!signal.aborted && nextPollMs !== pollIntervalMsRef.current) {
        setPollIntervalMs(nextPollMs)
      }
      return { ...data, period }
    },
    [periodId],
  )

  const { data, loading, error, refetch, updatedAt } = useFetch(fetcher)

  // trocar o período mostra "carregando" na hora (o refetch e a troca do fetcher caem no mesmo render)
  const setPeriodId = useCallback(
    (id: PeriodId) => {
      setPeriodIdState(id)
      refetch()
    },
    [refetch],
  )

  // atualização periódica reprogramada pelo intervalo efetivo (máx. 60 s) e só com a aba visível
  useEffect(() => {
    let timer = 0
    const schedule = () => {
      window.clearInterval(timer)
      if (document.visibilityState === 'visible') timer = window.setInterval(refetch, pollIntervalMs)
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
  }, [refetch, pollIntervalMs])

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
