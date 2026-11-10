import type { EmissionsPeriod } from '../types/api'

// Períodos do filtro do dashboard. Todos usam os parâmetros reais `start`/`end`
// dos endpoints /collections/emissions/*; nada aqui é calculado no frontend além da janela.

export type PeriodId = '1h' | '24h' | '7d' | '30d'

export type PeriodOption = {
  id: PeriodId
  /** rótulo curto do botão */
  label: string
  /** usado em frases: "Últimas 24 h" */
  description: string
  durationMs: number
  /** tamanho de cada ponto do gráfico de evolução (GET /collections/timeseries?bucketSeconds=) */
  bucketSeconds: number
  /** intervalo de cada ponto, para o título do gráfico: "a cada 15 min" */
  bucketLabel: string
}

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

export const PERIOD_OPTIONS: PeriodOption[] = [
  { id: '1h', label: '1 h', description: 'Última hora', durationMs: HOUR_MS, bucketSeconds: 60, bucketLabel: 'a cada 1 min' },
  { id: '24h', label: '24 h', description: 'Últimas 24 h', durationMs: DAY_MS, bucketSeconds: 900, bucketLabel: 'a cada 15 min' },
  { id: '7d', label: '7 dias', description: 'Últimos 7 dias', durationMs: 7 * DAY_MS, bucketSeconds: 7200, bucketLabel: 'a cada 2 h' },
  { id: '30d', label: '30 dias', description: 'Últimos 30 dias', durationMs: 30 * DAY_MS, bucketSeconds: 21600, bucketLabel: 'a cada 6 h' },
]

export const DEFAULT_PERIOD_ID: PeriodId = '24h'

export function getPeriodOption(id: PeriodId): PeriodOption {
  return PERIOD_OPTIONS.find((option) => option.id === id) ?? PERIOD_OPTIONS[1]
}

/** Janela que termina agora. */
export function getPeriodRange(id: PeriodId, end: Date = new Date()): EmissionsPeriod {
  return { start: new Date(end.getTime() - getPeriodOption(id).durationMs), end }
}
