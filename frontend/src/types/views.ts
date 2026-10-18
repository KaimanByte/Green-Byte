// Modelos de visualização (view models) da tela inicial.
// Já vêm formatados e com fallbacks aplicados: os componentes só exibem esses valores
// e nunca dependem do formato cru dos DTOs de transporte (types/api.ts).

import type { CarbonLevel } from '../data/regions'

export type RegionView = {
  code: string
  /** Nome curto para exibição (cidade, ou nome da região quando não há cidade). */
  displayName: string
  /** Ex.: "Sudeste · Brazil". */
  locationLabel: string
  /** gCO₂e/kWh */
  carbonIntensity: number
  /** % de fontes renováveis na matriz elétrica. */
  renewableSharePercent: number
  carbonLevel: CarbonLevel
}

export type ServiceView = {
  id: string
  name: string
  /** Texto do estado do serviço (ex.: "Registrado"). */
  statusLabel: string
  regionCode: string
  /** Ex.: "São Paulo · Sudeste · Brazil". */
  locationLabel: string
  /** `null` quando a região do serviço não foi encontrada na API de regiões. */
  carbonLevel: CarbonLevel | null
  /** Energia no período, já com unidade (ex.: "1,80 kWh"), ou "—" sem métricas. */
  energyLabel: string
  /** Emissões no período, já com unidade (ex.: "152 gCO₂e"), ou "—" sem métricas. */
  emissionsLabel: string
  hasMetrics: boolean
}

/**
 * Estado da listagem de serviços da tela inicial.
 * União discriminada: cada estado carrega apenas o que a tela precisa dele.
 */
export type ServiceListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | {
      status: 'ready'
      services: ServiceView[]
      /** Falha numa atualização posterior: a lista anterior continua válida. */
      refreshError: string | null
    }
