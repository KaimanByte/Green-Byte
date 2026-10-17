import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../services/api'

export type FetchState<T> = {
  /** Último resultado bem-sucedido (mantido durante refetch). `null` até a primeira resposta. */
  data: T | null
  /** Mensagem legível do último erro, ou `null`. */
  error: string | null
  loading: boolean
  /** Momento da última resposta bem-sucedida. */
  updatedAt: Date | null
}

export type UseFetchResult<T> = FetchState<T> & {
  /** Refaz a busca (mantém `data` anterior enquanto carrega). */
  refetch: () => void
}

/**
 * Hook genérico de busca com estados loading / error / data e refetch.
 * `fetcher` deve ter identidade estável (função de módulo ou `useCallback`), pois
 * uma nova referência dispara nova busca. Requisições em andamento são abortadas
 * ao desmontar ou refazer a busca.
 */
export function useFetch<T>(fetcher: (signal: AbortSignal) => Promise<T>): UseFetchResult<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    loading: true,
    updatedAt: null,
  })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetcher(controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return
        setState({ data, error: null, loading: false, updatedAt: new Date() })
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        console.error('Falha ao buscar dados da API:', error)
        setState((previous) => ({ ...previous, error: getErrorMessage(error), loading: false }))
      },
    )

    return () => controller.abort()
  }, [fetcher, attempt])

  const refetch = useCallback(() => {
    setState((previous) => ({ ...previous, error: null, loading: true }))
    setAttempt((current) => current + 1)
  }, [])

  return { ...state, refetch }
}
