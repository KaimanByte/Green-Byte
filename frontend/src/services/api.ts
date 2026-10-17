// Cliente HTTP base. Único ponto do frontend autorizado a chamar `fetch` (critério FE-01 / DW05).

const DEFAULT_API_URL = 'http://localhost:3001'

/** URL base da API: VITE_API_URL (se definida e não vazia) ou fallback local; sem barras finais. */
export const API_URL: string = (import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_URL).replace(/\/+$/, '')

/** Erro de requisição à API: HTTP não-2xx (status > 0) ou falha de rede (status 0). */
export class ApiError extends Error {
  readonly status: number
  readonly url: string

  constructor(message: string, status: number, url: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.url = url
  }
}

type QueryValue = string | number | boolean | Date | null | undefined

export type RequestOptions = {
  query?: Record<string, QueryValue>
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue
    url.searchParams.set(key, value instanceof Date ? value.toISOString() : String(value))
  }
  return url.toString()
}

export async function request<T>(path: string, { query, signal }: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, query)

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal,
    })
  } catch (error) {
    // cancelamento (AbortController) não é erro da API: propaga como está
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Não foi possível conectar à API.', 0, url)
  }

  if (!response.ok) {
    throw new ApiError(`A API respondeu com erro HTTP ${response.status}.`, response.status, url)
  }

  return (await response.json()) as T
}

/** Mensagem legível para exibir ao usuário a partir de qualquer erro capturado. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Erro desconhecido.'
}
