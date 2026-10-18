import { useMemo } from 'react'
import { createServiceViews } from '../factories/createServiceViews'
import type { ServiceListState } from '../types/views'
import { useGreenData } from './useGreenData'

export type UseServiceViewsResult = {
  state: ServiceListState
  /** Há uma busca em andamento (inclusive atualizações com a lista já exibida). */
  refreshing: boolean
  refetch: () => void
}

/**
 * Expõe os serviços do backend como modelos de visualização, já com os estados
 * loading / error / empty / ready resolvidos. Consome apenas o contexto de dados.
 */
export function useServiceViews(): UseServiceViewsResult {
  const { services, regions, serviceEmissions, loading, error, lastSync, refetch } = useGreenData()

  const views = useMemo(
    () => createServiceViews({ services, regions, serviceEmissions }),
    [services, regions, serviceEmissions],
  )

  // lastSync só existe depois de ao menos uma resposta bem-sucedida
  const hasLoaded = lastSync !== null

  const state = useMemo<ServiceListState>(() => {
    if (!hasLoaded) {
      return error ? { status: 'error', message: error } : { status: 'loading' }
    }
    if (views.length === 0) return { status: 'empty' }
    return { status: 'ready', services: views, refreshError: error }
  }, [hasLoaded, error, views])

  return { state, refreshing: loading, refetch }
}
