import { useMemo, type ReactNode } from 'react'
import { GreenDataContext, type GreenDataContextValue } from '../contexts/GreenDataContext'
import { useFetch } from '../hooks/useFetch'
import { getDashboardData } from '../services/dashboardService'

/**
 * Busca os dados do backend uma única vez e os compartilha com todo o app,
 * evitando que cada componente dispare suas próprias requisições.
 */
export function GreenDataProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, refetch, updatedAt } = useFetch(getDashboardData)

  const value = useMemo<GreenDataContextValue>(
    () => ({
      regions: data?.regions ?? [],
      services: data?.services ?? [],
      emissions: data?.emissions ?? [],
      serviceEmissions: data?.serviceEmissions ?? [],
      loading,
      error,
      refetch,
      lastSync: updatedAt,
    }),
    [data, loading, error, refetch, updatedAt],
  )

  return <GreenDataContext.Provider value={value}>{children}</GreenDataContext.Provider>
}
