import { describe, expect, it } from 'vitest'
import { dashboardRefreshIntervalMs } from './collectionRefresh'

describe('dashboardRefreshIntervalMs', () => {
  it('acompanha intervalos de coleta de até 60 segundos', () => {
    expect(dashboardRefreshIntervalMs(5)).toBe(5_000)
    expect(dashboardRefreshIntervalMs(60)).toBe(60_000)
  })

  it('limita intervalos maiores que um minuto a 60 segundos', () => {
    expect(dashboardRefreshIntervalMs(120)).toBe(60_000)
  })

  it('usa 60 segundos quando não recebe um intervalo válido', () => {
    expect(dashboardRefreshIntervalMs(null)).toBe(60_000)
    expect(dashboardRefreshIntervalMs(0)).toBe(60_000)
  })
})
