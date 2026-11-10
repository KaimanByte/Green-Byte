// Sessão de login: único ponto do frontend que lê e grava o token.
//
// Decisão de armazenamento: `sessionStorage`. O token sobrevive ao recarregar a página,
// mas some ao fechar a aba, o que reduz o tempo em que fica exposto a um eventual script
// malicioso (XSS). O `localStorage` manteria o login entre abas e reinícios do navegador,
// ao custo de deixar o token guardado por muito mais tempo.

import type { UserDto } from '../types/api'

export type AuthSession = {
  token: string
  user: UserDto
}

const STORAGE_KEY = 'greenbyte.auth'

type Listener = () => void
const listeners = new Set<Listener>()

/** `undefined` = ainda não lido do armazenamento. */
let current: AuthSession | null | undefined

/** Momento (ms) em que o token expira, lido do campo `exp` do JWT; `null` se não der para ler. */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const exp = (JSON.parse(json) as { exp?: unknown }).exp
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

function isExpired(token: string): boolean {
  const expiry = getTokenExpiry(token)
  return expiry !== null && expiry <= Date.now()
}

function isSession(value: unknown): value is AuthSession {
  if (typeof value !== 'object' || value === null) return false
  const { token, user } = value as { token?: unknown; user?: { id?: unknown; email?: unknown } | null }
  return typeof token === 'string' && token !== '' && typeof user?.id === 'number' && typeof user.email === 'string'
}

function load(): AuthSession | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (isSession(parsed) && !isExpired(parsed.token)) return parsed
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // armazenamento bloqueado ou conteúdo corrompido: segue deslogado
  }
  return null
}

function notify() {
  for (const listener of listeners) listener()
}

/** Sessão atual, ou `null` se deslogado. Devolve sempre a mesma referência até a sessão mudar. */
export function getSession(): AuthSession | null {
  if (current === undefined) current = load()
  return current
}

/** Token JWT da sessão atual, ou `null`. Um token já expirado encerra a sessão. */
export function getToken(): string | null {
  const session = getSession()
  if (session && isExpired(session.token)) {
    clearSession()
    return null
  }
  return session?.token ?? null
}

export function saveSession(session: AuthSession): void {
  current = session
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // sem armazenamento a sessão vale só até recarregar a página
  }
  notify()
}

export function clearSession(): void {
  const hadSession = getSession() !== null
  current = null
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // nada a limpar
  }
  if (hadSession) notify()
}

/** Avisa quando a sessão muda (login, logout ou token recusado pela API). Devolve a função para cancelar. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
