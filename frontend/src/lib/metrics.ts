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
 * Monta a série completa do período: um ponto por intervalo, alinhado ao `from` da resposta
 * (o backend alinha os intervalos pelo mesmo `from`). Intervalos que não vieram na resposta
 * ficam com `value: null` — nunca são preenchidos com zero ou com valor inventado.
 */
export function buildSeries(
  points: TimeSeriesPointDto[],
  metric: MetricId,
  from: Date,
  to: Date,
  bucketSeconds: number,
): SeriesPoint[] {
  const stepMs = bucketSeconds * 1000
  const byTime = new Map(points.map((point) => [new Date(point.timestamp).getTime(), point]))
  const series: SeriesPoint[] = []

  for (let time = from.getTime(); time <= to.getTime(); time += stepMs) {
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
