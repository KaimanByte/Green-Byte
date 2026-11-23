/** Intervalo usado quando nem o banco nem o .env definem um. */
export const DEFAULT_COLLECTION_INTERVAL_SECONDS = 30;

/** Maior atraso aceito por setInterval (2^31 - 1 ms), em segundos. */
export const MAX_TIMER_INTERVAL_SECONDS = Math.floor(2_147_483_647 / 1_000);

/** Faixa que a área administrativa aceita ao alterar o intervalo. */
export const MIN_CONFIGURABLE_INTERVAL_SECONDS = 5;
export const MAX_CONFIGURABLE_INTERVAL_SECONDS = 86_400;

/**
 * Intervalo de coleta do .env (COLLECTION_INTERVAL_SECONDS), em segundos.
 * É só o valor INICIAL: depois que a configuração existe no banco, vale o que o
 * administrador salvou. Valor inválido derruba o startup, em vez de coletar num ritmo errado.
 */
export function readCollectionIntervalFromEnv(): number {
  const configuredValue = process.env.COLLECTION_INTERVAL_SECONDS?.trim();

  if (!configuredValue) {
    return DEFAULT_COLLECTION_INTERVAL_SECONDS;
  }

  if (!/^\d+$/.test(configuredValue)) {
    throw new Error(
      'COLLECTION_INTERVAL_SECONDS deve ser um número inteiro positivo expresso em segundos.',
    );
  }

  const intervalSeconds = Number(configuredValue);
  if (
    !Number.isSafeInteger(intervalSeconds) ||
    intervalSeconds < 1 ||
    intervalSeconds > MAX_TIMER_INTERVAL_SECONDS
  ) {
    throw new Error(
      `COLLECTION_INTERVAL_SECONDS deve estar entre 1 e ${MAX_TIMER_INTERVAL_SECONDS} segundos.`,
    );
  }

  return intervalSeconds;
}
