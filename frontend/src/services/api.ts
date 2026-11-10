// Cliente HTTP base. Único ponto do frontend autorizado a chamar `fetch` (critério FE-01 / DW05).

import { clearSession, getToken } from './authStorage'

const DEFAULT_API_URL = 'http://localhost:3001'

/** URL base da API: VITE_API_URL (se definida e não vazia) ou fallback local; sem barras finais. */
export const API_URL: string = (import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_URL).replace(/\/+$/, '')

/** Erro de requisição à API: HTTP não-2xx (status > 0) ou falha de rede (status 0). */
export class ApiError extends Error {
  readonly status: number
  readonly url: string
  /** Mensagens enviadas pelo backend no corpo do erro (ex.: validação do DTO); vazio se não houver. */
  readonly details: string[]

  constructor(message: string, status: number, url: string, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.url = url
    this.details = details
  }
}

type QueryValue = string | number | boolean | Date | null | undefined

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type RequestOptions = {
  query?: Record<string, QueryValue>
  signal?: AbortSignal
  /** Método HTTP; padrão `GET`. */
  method?: HttpMethod
  /** Corpo enviado como JSON. Só `undefined` significa "sem corpo" (`0`, `false` e `''` são enviados). */
  body?: unknown
  /** Cabeçalhos extras (sobrepõem os padrões). */
  headers?: Record<string, string>
  /**
   * Rota protegida: envia `Authorization: Bearer <token>` da sessão atual.
   * Se a API responder 401, a sessão é encerrada (token expirado ou inválido).
   */
  auth?: boolean
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue
    url.searchParams.set(key, value instanceof Date ? value.toISOString() : String(value))
  }
  return url.toString()
}

/** Mensagens do corpo de erro do NestJS (`{ message: string | string[] }`); vazio se não der para ler. */
async function readErrorDetails(response: Response): Promise<string[]> {
  try {
    const payload: unknown = await response.json()
    const message = (payload as { message?: unknown } | null)?.message
    const list = Array.isArray(message) ? message : [message]
    return list.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
  } catch {
    return []
  }
}

export async function request<T>(
  path: string,
  { query, signal, method = 'GET', body, headers, auth = false }: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(path, query)
  const hasBody = body !== undefined
  const token = auth ? getToken() : null

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        // Content-Type só quando há corpo: um GET continua sendo uma requisição simples
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: hasBody ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal,
    })
  } catch (error) {
    // cancelamento (AbortController) não é erro da API: propaga como está
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Não foi possível conectar à API.', 0, url)
  }

  if (!response.ok) {
    // 401 numa rota protegida: o token não vale mais, então a sessão volta ao estado deslogado
    if (response.status === 401 && auth) clearSession()
    const details = await readErrorDetails(response)
    throw new ApiError(`A API respondeu com erro HTTP ${response.status}.`, response.status, url, details)
  }

  // 204 No Content não tem corpo: quem chama deve tipar a resposta como `void`
  if (response.status === 204) return undefined as T

  return (await response.json()) as T
}

/** Mensagem legível para exibir ao usuário a partir de qualquer erro capturado. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Erro desconhecido.'
}
