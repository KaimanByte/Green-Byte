import { describe, expect, it } from 'vitest'
import { niceScale, stepDecimals, tickFormatter } from './chartScale'

describe('niceScale', () => {
  it('cobre os dados com marcas redondas', () => {
    const scale = niceScale(0.0127, 0.3076)
    expect(scale.min).toBeLessThanOrEqual(0.0127)
    expect(scale.max).toBeGreaterThanOrEqual(0.3076)
    expect(scale.ticks).toEqual([0, 0.1, 0.2, 0.3, 0.4])
  })

  it('não começa em zero quando os dados estão longe dele (a variação continua visível)', () => {
    const scale = niceScale(72.4, 83.9)
    expect(scale.ticks).toEqual([70, 75, 80, 85])
  })

  it('nunca desce abaixo de zero', () => {
    expect(niceScale(0.2, 9).min).toBe(0)
  })

  it('com todos os valores iguais abre uma faixa em volta deles', () => {
    const scale = niceScale(50, 50)
    expect(scale.min).toBeLessThan(50)
    expect(scale.max).toBeGreaterThan(50)
  })

  it('sem dados (tudo zero) ainda produz um eixo válido', () => {
    expect(niceScale(0, 0).ticks).toEqual([0, 0.5, 1])
  })

  it('não cria marcas fantasmas por erro de ponto flutuante', () => {
    const { ticks } = niceScale(0.1, 0.3, 3)
    expect(ticks.every((tick) => Number(tick.toPrecision(6)) === tick)).toBe(true)
  })
})

describe('tickFormatter', () => {
  it('usa vírgula e o mesmo número de casas em todas as marcas', () => {
    const format = tickFormatter(0.1)
    expect([0, 0.1, 0.2].map(format)).toEqual(['0,0', '0,1', '0,2'])
  })

  it('passos fracionários ganham as casas necessárias', () => {
    expect(stepDecimals(2.5)).toBe(1)
    expect(stepDecimals(0.025)).toBe(3)
    expect(stepDecimals(5)).toBe(0)
  })

  it('separa milhar em números grandes', () => {
    expect(tickFormatter(500)(1500)).toBe('1.500')
  })
})
