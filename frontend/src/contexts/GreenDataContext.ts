import { createContext } from 'react'
import type {
  CollectionDto,
  EmissionsPeriod,
  RegionDto,
  RegionEmissionsDto,
  ServiceDto,
  ServiceEmissionsDto,
  SummaryDto,
} from '../types/api'
import type { PeriodId } from '../lib/periods'

export type GreenDataContextValue = {
  regions: RegionDto[]
  services: ServiceDto[]
  emissions: RegionEmissionsDto[]
  serviceEmissions: ServiceEmissionsDto[]
  /** Coleta mais recente de cada serviço que já teve coleta. */
  latestCollections: CollectionDto[]
  /** Horário da coleta mais recente gravada no banco (entre todos os serviços), ou `null`. */
  lastCollectionAt: Date | null
  /** Totais e contagem de serviços por estado (GET /summary), ou `null` antes da 1ª resposta. */
  summary: SummaryDto | null
  loading: boolean
  /** Mensagem legível do último erro de carregamento, ou `null`. */
  error: string | null
  /** Fontes que falharam na última carga (carga parcial); vazio quando todas responderam. */
  failedSources: string[]
  refetch: () => void
  /** Momento da última sincronização bem-sucedida com o backend. */
  lastSync: Date | null
  /** Período selecionado no filtro (aplica-se a `emissions` e `serviceEmissions`). */
  periodId: PeriodId
  setPeriodId: (id: PeriodId) => void
  /** Janela exata usada na última busca. */
  period: EmissionsPeriod
}

export const GreenDataContext = createContext<GreenDataContextValue | null>(null)
