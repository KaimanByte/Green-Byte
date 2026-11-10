import { describe, expect, it } from 'vitest'
import { DEFAULT_PERIOD_ID, getPeriodOption, getPeriodRange, PERIOD_OPTIONS } from './periods'

describe('periods', () => {
  it('mantém 24 h como período padrão e opções com janelas e buckets coerentes', () => {
    expect(DEFAULT_PERIOD_ID).toBe('24h')
    expect(PERIOD_OPTIONS.map(({ id, bucketSeconds }) => [id, bucketSeconds])).toEqual([
      ['1h', 60],
      ['24h', 900],
      ['7d', 7200],
      ['30d', 21600],
    ])
  })

  it('calcula a janela a partir do instante final recebido, sem depender do relógio local', () => {
    const end = new Date('2026-11-10T12:00:00.000Z')
    const range = getPeriodRange('7d', end)

    expect(range.start.toISOString()).toBe('2026-11-03T12:00:00.000Z')
    expect(range.end).toBe(end)
  })

  it('usa a opção padrão quando recebe um identificador inválido em tempo de execução', () => {
    expect(getPeriodOption('invalid' as never)).toBe(getPeriodOption(DEFAULT_PERIOD_ID))
  })
})
