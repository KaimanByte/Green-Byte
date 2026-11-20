import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_POLL_INTERVAL_SECONDS,
  MAX_POLL_INTERVAL_MS,
  MAX_POLL_INTERVAL_SECONDS,
  resolvePollIntervalMs,
  resolvePollIntervalSeconds,
} from './polling'
import { fetchSafePollIntervalMs } from '../services/monitoringService'

describe('resolvePollIntervalSeconds / resolvePollIntervalMs', () => {
  it('acompanha o intervalo efetivo quando ele é menor que 60 s', () => {
    expect(resolvePollIntervalSeconds(10)).toBe(10)
    expect(resolvePollIntervalSeconds(45)).toBe(45)
    expect(resolvePollIntervalMs(15)).toBe(15_000)
  })

  it('limita o polling ao teto máximo de 60 s quando a coleta for maior que 60 s', () => {
    expect(resolvePollIntervalSeconds(60)).toBe(MAX_POLL_INTERVAL_SECONDS)
    expect(resolvePollIntervalSeconds(120)).toBe(MAX_POLL_INTERVAL_SECONDS)
    expect(resolvePollIntervalSeconds(3600)).toBe(60)
    expect(resolvePollIntervalMs(300)).toBe(MAX_POLL_INTERVAL_MS)
  })

  it('usa fallback seguro quando o intervalo é ausente ou inválido', () => {
    expect(resolvePollIntervalSeconds(undefined)).toBe(DEFAULT_POLL_INTERVAL_SECONDS)
    expect(resolvePollIntervalSeconds(null)).toBe(DEFAULT_POLL_INTERVAL_SECONDS)
    expect(resolvePollIntervalSeconds(0)).toBe(DEFAULT_POLL_INTERVAL_SECONDS)
    expect(resolvePollIntervalSeconds(-15)).toBe(DEFAULT_POLL_INTERVAL_SECONDS)
    expect(resolvePollIntervalSeconds(Number.NaN, 20)).toBe(20)
    expect(resolvePollIntervalSeconds(Number.NaN, 120)).toBe(60)
    expect(resolvePollIntervalMs(undefined)).toBe(DEFAULT_POLL_INTERVAL_MS)
    expect(resolvePollIntervalMs(undefined, 45_000)).toBe(45_000)
    expect(resolvePollIntervalMs(undefined, 120_000)).toBe(MAX_POLL_INTERVAL_MS)
  })
})

describe('fetchSafePollIntervalMs', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('retorna o intervalo efetivo limitado a 60 s quando o backend responde', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ effectiveIntervalSeconds: 180, recommendedPollSeconds: 60 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch

    await expect(fetchSafePollIntervalMs(30_000)).resolves.toBe(60_000)

    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ effectiveIntervalSeconds: 12, recommendedPollSeconds: 12 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as typeof fetch

    await expect(fetchSafePollIntervalMs(30_000)).resolves.toBe(12_000)
  })

  it('mantém o fallback seguro sem lançar erro quando a consulta falha', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('Network error')
    }) as unknown as typeof fetch

    await expect(fetchSafePollIntervalMs(45_000)).resolves.toBe(45_000)

    globalThis.fetch = vi.fn(async () =>
      new Response('Internal Server Error', { status: 500 }),
    ) as unknown as typeof fetch

    await expect(fetchSafePollIntervalMs(25_000)).resolves.toBe(25_000)
  })
})
