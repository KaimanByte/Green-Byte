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
