export const DEFAULT_COLLECTION_INTERVAL_SECONDS = 30;
export const MIN_COLLECTION_INTERVAL_SECONDS = 1;
export const MAX_COLLECTION_INTERVAL_SECONDS = Math.floor(2_147_483_647 / 1_000);
export const MAX_UPDATE_INTERVAL_SECONDS = 86_400;
export const MAX_FRONTEND_POLL_SECONDS = 60;

/**
 * Calcula o intervalo recomendado de polling para o frontend em segundos,
 * impondo o teto estrito de 60 segundos e usando fallback seguro para valores inválidos.
 */
export function resolveRecommendedPollSeconds(
  effectiveIntervalSeconds?: number | null,
  fallbackSeconds: number = DEFAULT_COLLECTION_INTERVAL_SECONDS,
): number {
  if (
    typeof effectiveIntervalSeconds === 'number' &&
    Number.isFinite(effectiveIntervalSeconds) &&
    effectiveIntervalSeconds >= MIN_COLLECTION_INTERVAL_SECONDS
  ) {
    return Math.min(Math.floor(effectiveIntervalSeconds), MAX_FRONTEND_POLL_SECONDS);
  }

  const safeFallback =
    typeof fallbackSeconds === 'number' &&
    Number.isFinite(fallbackSeconds) &&
    fallbackSeconds >= MIN_COLLECTION_INTERVAL_SECONDS
      ? Math.floor(fallbackSeconds)
      : DEFAULT_COLLECTION_INTERVAL_SECONDS;

  return Math.min(safeFallback, MAX_FRONTEND_POLL_SECONDS);
}
