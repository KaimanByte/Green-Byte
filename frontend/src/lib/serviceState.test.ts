import { describe, expect, it } from 'vitest'
import type { ServiceIndicatorState } from '../types/api'
import { SERVICE_STATE_LABELS } from './serviceState'

describe('SERVICE_STATE_LABELS', () => {
  it.each([
    ['active', 'ativo'],
    ['unavailable', 'indisponível'],
    ['no_metrics', 'sem métricas'],
  ] satisfies Array<[ServiceIndicatorState, string]>)('traduz %s para %s', (state, label) => {
    expect(SERVICE_STATE_LABELS[state]).toBe(label)
  })
})
