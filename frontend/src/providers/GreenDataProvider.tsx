import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { GreenDataContext, type GreenDataContextValue } from '../contexts/GreenDataContext'
import { useFetch } from '../hooks/useFetch'
import { getDashboardData, type DashboardData } from '../services/dashboardService'
import { DEFAULT_PERIOD_ID, getPeriodRange, type PeriodId } from '../lib/periods'
import {
  dashboardRefreshIntervalMs,
  nextRefreshDelayMs,
  subscribeToCollectionIntervalChanged,
} from '../lib/collectionRefresh'
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

  // horário da coleta mais recente gravada no banco (entre todos os serviços)
  const latestCollections = data?.latestCollections
  const lastCollectionMs = useMemo(
    () =>
      (latestCollections ?? []).reduce((max, collection) => {
        const time = new Date(collection.timestamp).getTime()
        return Number.isFinite(time) ? Math.max(max, time) : max
      }, 0),
    [latestCollections],
  )

  // Atualização automática no ritmo do backend: depois de cada busca (com ou sem sucesso), a
  // próxima é marcada para logo depois da próxima coleta prevista, e não um intervalo fixo a
  // partir de agora. Só com a aba visível; ao reabrir a aba busca na hora.
  useEffect(() => {
    if (loading) return // a busca em andamento reagenda ao terminar

    let timer = 0
    const schedule = () => {
      window.clearTimeout(timer)
      if (document.visibilityState !== 'visible') return
      const lastCollectionAt = lastCollectionMs > 0 ? new Date(lastCollectionMs) : null
      timer = window.setTimeout(refetch, nextRefreshDelayMs(lastCollectionAt, collectionIntervalSeconds))
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refetch()
      else window.clearTimeout(timer)
    }

    schedule()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [loading, refetch, lastCollectionMs, collectionIntervalSeconds])

  const value = useMemo<GreenDataContextValue>(() => {
    return {
      regions: data?.regions ?? [],
      services: data?.services ?? [],
      emissions: data?.emissions ?? [],
      serviceEmissions: data?.serviceEmissions ?? [],
      latestCollections: latestCollections ?? [],
      lastCollectionAt: lastCollectionMs > 0 ? new Date(lastCollectionMs) : null,
      summary: data?.summary ?? null,
      loading,
      error,
      failedSources: data?.failedSources ?? [],
      refetch,
      lastSync: updatedAt,
      refreshIntervalSeconds: refreshIntervalMs / 1_000,
      periodId,
      setPeriodId,
      period: data?.period ?? getPeriodRange(periodId),
    }
  }, [data, latestCollections, lastCollectionMs, loading, error, refetch, updatedAt, refreshIntervalMs, periodId, setPeriodId])

  return <GreenDataContext.Provider value={value}>{children}</GreenDataContext.Provider>
}
