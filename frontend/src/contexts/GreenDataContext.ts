import { createContext } from 'react'
import type {
  RegionDto,
  RegionEmissionsDto,
  ServiceDto,
  ServiceEmissionsDto,
} from '../types/api'

export type GreenDataContextValue = {
  regions: RegionDto[]
  services: ServiceDto[]
  emissions: RegionEmissionsDto[]
  serviceEmissions: ServiceEmissionsDto[]
  loading: boolean
  /** Mensagem legível do último erro de carregamento, ou `null`. */
  error: string | null
  refetch: () => void
  /** Momento da última sincronização bem-sucedida com o backend. */
  lastSync: Date | null
}

export const GreenDataContext = createContext<GreenDataContextValue | null>(null)
