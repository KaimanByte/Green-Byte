import type { TimeSeriesPointDto } from '../types/api'
import { decimal, formatCo2Text, significant } from './format'

// Métricas que o gráfico de evolução sabe mostrar. Todas vêm de GET /collections/timeseries,
// que devolve a MÉDIA das coletas de cada intervalo.

export type MetricId = 'co2Emissions' | 'energyKwh' | 'cpuPercent' | 'memoryGb' | 'diskGb'

export type MetricOption = {
  id: MetricId
  /** rótulo curto do botão */
  label: string
  /** título do gráfico: "CO₂e médio por coleta" */
  title: string
  unit: string
  format: (value: number) => string
}

export const METRIC_OPTIONS: MetricOption[] = [
  { id: 'co2Emissions', label: 'CO₂e', title: 'CO₂e médio por coleta', unit: 'gCO₂e', format: formatCo2Text },
  { id: 'energyKwh', label: 'Energia', title: 'Energia média por coleta', unit: 'kWh', format: (v) => `${significant.format(v)} kWh` },
  { id: 'cpuPercent', label: 'CPU', title: 'Uso médio de CPU', unit: '%', format: (v) => `${decimal.format(v)} %` },
  { id: 'memoryGb', label: 'Memória', title: 'Memória média', unit: 'GB', format: (v) => `${decimal.format(v)} GB` },
  { id: 'diskGb', label: 'Disco', title: 'Disco médio', unit: 'GB', format: (v) => `${decimal.format(v)} GB` },
]

export function getMetricOption(id: MetricId): MetricOption {
  return METRIC_OPTIONS.find((option) => option.id === id) ?? METRIC_OPTIONS[0]
}

/** Ponto pronto para o gráfico: `value` null = intervalo sem coleta (o gráfico deixa uma lacuna). */
export type SeriesPoint = {
  timestamp: Date
  value: number | null
  collectionsCount: number
}

/**
 * Horários das pontas do eixo do tempo: à direita a última amostra; à esquerda ela menos o
 * período pedido (24 h, 7 dias…). O gráfico sempre desenha o período inteiro, vazio ou não.
 */
export function periodEdges(lastSampleAt: Date, periodMs: number): { start: Date; end: Date } {
  return { start: new Date(lastSampleAt.getTime() - periodMs), end: lastSampleAt }
}

/**
 * Monta a série completa do período: um ponto por intervalo, na mesma grade do backend
 * (intervalos começam em `origin` + n × bucketSeconds; sem `origin`, no próprio `from`).
 * O primeiro intervalo é o que contém `from`. Intervalos que não vieram na resposta
 * ficam com `value: null` — nunca são preenchidos com zero ou com valor inventado.
 */
export function buildSeries(
  points: TimeSeriesPointDto[],
  metric: MetricId,
  from: Date,
  to: Date,
  bucketSeconds: number,
  origin: Date = from,
): SeriesPoint[] {
  const stepMs = bucketSeconds * 1000
  const byTime = new Map(points.map((point) => [new Date(point.timestamp).getTime(), point]))
  const series: SeriesPoint[] = []
  const first = origin.getTime() + Math.floor((from.getTime() - origin.getTime()) / stepMs) * stepMs

  for (let time = first; time <= to.getTime(); time += stepMs) {
    const point = byTime.get(time)
    const value = point ? Number(point[metric]) : NaN
    series.push({
      timestamp: new Date(time),
      value: Number.isFinite(value) ? value : null,
      collectionsCount: point?.collectionsCount ?? 0,
    })
  }
  return series
}
