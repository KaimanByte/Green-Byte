export const MAX_POLL_INTERVAL_SECONDS = 60
export const DEFAULT_POLL_INTERVAL_SECONDS = 30
export const MAX_POLL_INTERVAL_MS = MAX_POLL_INTERVAL_SECONDS * 1_000
export const DEFAULT_POLL_INTERVAL_MS = DEFAULT_POLL_INTERVAL_SECONDS * 1_000

/**
 * Calcula o intervalo efetivo de polling do dashboard em segundos, respeitando
 * o teto estrito de 60 segundos e usando fallback seguro quando o valor for inválido/ausente.
 */
export function resolvePollIntervalSeconds(
  effectiveIntervalSeconds?: number | null,
  fallbackSeconds: number = DEFAULT_POLL_INTERVAL_SECONDS,
): number {
  if (
    typeof effectiveIntervalSeconds === 'number' &&
    Number.isFinite(effectiveIntervalSeconds) &&
    effectiveIntervalSeconds >= 1
  ) {
    return Math.min(Math.floor(effectiveIntervalSeconds), MAX_POLL_INTERVAL_SECONDS)
  }

  const safeFallback =
    typeof fallbackSeconds === 'number' &&
    Number.isFinite(fallbackSeconds) &&
    fallbackSeconds >= 1
      ? Math.floor(fallbackSeconds)
      : DEFAULT_POLL_INTERVAL_SECONDS

  return Math.min(safeFallback, MAX_POLL_INTERVAL_SECONDS)
}

/** Versão em milissegundos de `resolvePollIntervalSeconds`, limitada a 60.000 ms. */
export function resolvePollIntervalMs(
  effectiveIntervalSeconds?: number | null,
  fallbackMs: number = DEFAULT_POLL_INTERVAL_MS,
): number {
  const fallbackSeconds =
    typeof fallbackMs === 'number' && Number.isFinite(fallbackMs) && fallbackMs >= 1_000
      ? Math.floor(fallbackMs / 1_000)
      : DEFAULT_POLL_INTERVAL_SECONDS

  return resolvePollIntervalSeconds(effectiveIntervalSeconds, fallbackSeconds) * 1_000
}
