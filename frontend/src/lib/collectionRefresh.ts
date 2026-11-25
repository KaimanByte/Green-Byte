/** O dashboard nunca espera mais de um minuto para buscar dados novos. */
export const MAX_DASHBOARD_REFRESH_SECONDS = 60

const INTERVAL_CHANGED_EVENT = 'green-byte:collection-interval-changed'

/**
 * Converte o intervalo efetivo da coleta no intervalo do polling do dashboard.
 * Valores inválidos preservam o comportamento seguro de 60 s.
 */
export function dashboardRefreshIntervalMs(intervalSeconds: number | null | undefined): number {
  if (!Number.isFinite(intervalSeconds) || (intervalSeconds ?? 0) <= 0) {
    return MAX_DASHBOARD_REFRESH_SECONDS * 1_000
  }
  return Math.min(intervalSeconds as number, MAX_DASHBOARD_REFRESH_SECONDS) * 1_000
}

/** Folga depois da coleta prevista: o ciclo do backend leva até ~1 s para gravar todas as coletas. */
export const REFRESH_GRACE_MS = 2_000
/** A coleta prevista já devia ter chegado e não chegou: tenta de novo depois deste tempo. */
export const OVERDUE_RETRY_MS = 3_000
/** Menor espera entre duas buscas, para nunca disparar buscas em sequência. */
const MIN_REFRESH_MS = 1_000

/**
 * Quanto esperar até a próxima busca, alinhada ao ritmo do backend: o backend coleta num ritmo
 * fixo, então a próxima coleta acontece um intervalo depois da última. A busca é marcada para
 * logo depois dela (com uma folga), em vez de um intervalo fixo contado a partir de agora,
 * que poderia chegar até um intervalo inteiro atrasado.
 *
 * - Próxima coleta ainda no futuro: espera até ela + folga (no máximo 60 s, como antes).
 * - Já passou da hora, mas há pouco tempo: tenta de novo em alguns segundos.
 * - Muito atrasada (backend parado ou lento): volta ao ritmo normal, sem insistir.
 * - Sem coleta ou sem intervalo conhecido: ritmo normal.
 */
export function nextRefreshDelayMs(
  lastCollectionAt: Date | null,
  intervalSeconds: number | null | undefined,
  now: number = Date.now(),
): number {
  const fallback = dashboardRefreshIntervalMs(intervalSeconds)
  if (!lastCollectionAt || !Number.isFinite(intervalSeconds) || (intervalSeconds ?? 0) <= 0) return fallback

  const intervalMs = (intervalSeconds as number) * 1_000
  const wait = lastCollectionAt.getTime() + intervalMs + REFRESH_GRACE_MS - now
  if (wait > 0) return Math.max(MIN_REFRESH_MS, Math.min(wait, MAX_DASHBOARD_REFRESH_SECONDS * 1_000))
  if (-wait < intervalMs) return OVERDUE_RETRY_MS
  return fallback
}

/** Comunica a mudança salva ao dashboard aberto nesta mesma aba, sem esperar o próximo polling. */
export function notifyCollectionIntervalChanged(intervalSeconds: number): void {
  window.dispatchEvent(new CustomEvent<number>(INTERVAL_CHANGED_EVENT, { detail: intervalSeconds }))
}

/** Assina mudanças locais de configuração do intervalo. */
export function subscribeToCollectionIntervalChanged(listener: (intervalSeconds: number) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<number>).detail)
  window.addEventListener(INTERVAL_CHANGED_EVENT, handler)
  return () => window.removeEventListener(INTERVAL_CHANGED_EVENT, handler)
}
