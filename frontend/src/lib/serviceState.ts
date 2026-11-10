import type { ServiceIndicatorState } from '../types/api'

/** Rótulos dos estados que o backend atribui a cada serviço no período (GET /ranking, /compare). */
export const SERVICE_STATE_LABELS: Record<ServiceIndicatorState, string> = {
  active: 'ativo',
  no_metrics: 'sem métricas',
  unavailable: 'indisponível',
}
