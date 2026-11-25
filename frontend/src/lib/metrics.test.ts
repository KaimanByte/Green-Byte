import { describe, expect, it } from 'vitest'
import type { TimeSeriesPointDto } from '../types/api'
import { buildSeries, getMetricOption, periodEdges } from './metrics'

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

  it('com origem, a grade começa no intervalo redondo que contém o from', () => {
    // janela começando 00:07 com intervalos de 15 min contados da meia-noite: 00:00, 00:15, 00:30
    const origin = new Date('2026-11-01T00:00:00.000Z')
    const series = buildSeries(
      [point('2026-11-01T00:00:00.000Z', { cpuPercent: 10 }), point('2026-11-01T00:30:00.000Z', { cpuPercent: 30 })],
      'cpuPercent',
      new Date('2026-11-01T00:07:00.000Z'),
      new Date('2026-11-01T00:37:00.000Z'),
      900,
      origin,
    )

    expect(series.map((p) => [p.timestamp.toISOString().slice(11, 16), p.value])).toEqual([
      ['00:00', 10],
      ['00:15', null],
      ['00:30', 30],
    ])
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

describe('periodEdges', () => {
  it('a ponta esquerda é a última amostra menos o período (24 h = um dia antes)', () => {
    const last = new Date('2026-11-25T05:15:00.000Z')
    expect(periodEdges(last, 24 * 3_600_000)).toEqual({ start: new Date('2026-11-24T05:15:00.000Z'), end: last })
  })
})
