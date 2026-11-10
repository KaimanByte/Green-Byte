import { describe, expect, it } from 'vitest'
import type { TimeSeriesPointDto } from '../types/api'
import { buildSeries, getMetricOption } from './metrics'

const point = (timestamp: string, overrides: Partial<TimeSeriesPointDto> = {}): TimeSeriesPointDto => ({
  timestamp,
  collectionsCount: 1,
  servicesCount: 1,
  cpuPercent: 20,
  memoryGb: 2,
  diskGb: 10,
  energyKwh: 0.25,
  co2Emissions: 80,
  ...overrides,
})

describe('buildSeries', () => {
  const from = new Date('2026-11-01T00:00:00.000Z')
  const to = new Date('2026-11-01T00:02:00.000Z')

  it('preserva uma lacuna como null, sem inventar zero para intervalo sem coleta', () => {
    const series = buildSeries(
      [
        point('2026-11-01T00:00:00.000Z', { energyKwh: 0.1 }),
        point('2026-11-01T00:02:00.000Z', { energyKwh: 0.3 }),
      ],
      'energyKwh',
      from,
      to,
      60,
    )

    expect(series).toEqual([
      { timestamp: from, value: 0.1, collectionsCount: 1 },
      { timestamp: new Date('2026-11-01T00:01:00.000Z'), value: null, collectionsCount: 0 },
      { timestamp: to, value: 0.3, collectionsCount: 1 },
    ])
  })

  it('descarta valores não finitos da API, mas preserva o total de coletas informado', () => {
    const series = buildSeries(
      [point('2026-11-01T00:00:00.000Z', { co2Emissions: Number.POSITIVE_INFINITY, collectionsCount: 4 })],
      'co2Emissions',
      from,
      from,
      60,
    )

    expect(series).toEqual([{ timestamp: from, value: null, collectionsCount: 4 }])
  })
})

describe('getMetricOption', () => {
  it('expõe unidade e rótulo corretos para a métrica de energia', () => {
    expect(getMetricOption('energyKwh')).toMatchObject({
      id: 'energyKwh',
      title: 'Energia média por coleta',
      unit: 'kWh',
    })
  })
})
