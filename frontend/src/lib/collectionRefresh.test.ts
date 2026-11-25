import { describe, expect, it } from 'vitest'
import {
  dashboardRefreshIntervalMs,
  nextRefreshDelayMs,
  OVERDUE_RETRY_MS,
  REFRESH_GRACE_MS,
} from './collectionRefresh'

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

describe('nextRefreshDelayMs', () => {
  const now = Date.parse('2026-11-25T12:00:00Z')
  const ago = (seconds: number) => new Date(now - seconds * 1_000)

  it('marca a busca para logo depois da próxima coleta do backend', () => {
    // coleta há 10 s, intervalo de 30 s: a próxima vem em 20 s; busca 2 s depois dela
    expect(nextRefreshDelayMs(ago(10), 30, now)).toBe(20_000 + REFRESH_GRACE_MS)
  })

  it('se a coleta acabou de acontecer, espera quase um intervalo inteiro', () => {
    expect(nextRefreshDelayMs(ago(0), 30, now)).toBe(30_000 + REFRESH_GRACE_MS)
  })

  it('nunca espera mais de 60 s, mesmo com coletas espaçadas', () => {
    expect(nextRefreshDelayMs(ago(10), 3_600, now)).toBe(60_000)
  })

  it('tenta de novo em poucos segundos quando a coleta prevista atrasou um pouco', () => {
    // prevista (com folga) para 5 s atrás e ainda não chegou
    expect(nextRefreshDelayMs(ago(37), 30, now)).toBe(OVERDUE_RETRY_MS)
  })

  it('volta ao ritmo normal quando o backend está muito atrasado', () => {
    expect(nextRefreshDelayMs(ago(300), 30, now)).toBe(30_000)
  })

  it('sem coleta ou sem intervalo conhecido usa o ritmo normal', () => {
    expect(nextRefreshDelayMs(null, 30, now)).toBe(30_000)
    expect(nextRefreshDelayMs(ago(10), null, now)).toBe(60_000)
  })

  it('não agenda buscas coladas uma na outra', () => {
    // a próxima coleta + folga cai daqui a 0,2 s
    expect(nextRefreshDelayMs(new Date(now - 31_800), 30, now)).toBe(1_000)
  })
})
