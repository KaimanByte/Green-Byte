import type {
  CollectionDto,
  EmissionsPeriod,
  RegionDto,
  RegionEmissionsDto,
  ServiceDto,
  ServiceEmissionsDto,
  SummaryDto,
} from '../types/api'
import {
  getCollectionsByService,
  getEmissionsByRegion,
  getEmissionsByService,
  getLast24Hours,
} from './collectionsService'
import { getSummary } from './indicatorsService'
import { getRegions } from './regionsService'
import { getServices } from './servicesService'

/** Conjunto de dados consumido pelo dashboard, carregado de uma só vez. */
export type DashboardData = {
  regions: RegionDto[]
  services: ServiceDto[]
  emissions: RegionEmissionsDto[]
  serviceEmissions: ServiceEmissionsDto[]
  /** Coleta mais recente de cada serviço (GET /collections/service/:id?limit=1). Serviços sem coleta ficam de fora. */
  latestCollections: CollectionDto[]
  /** Totais oficiais e estado dos serviços no período (GET /summary). */
  summary: SummaryDto
}

/**
 * Última coleta de cada serviço. Uma falha isolada não derruba o dashboard:
 * o serviço só fica sem "última coleta" (Promise.allSettled).
 */
async function getLatestCollections(
  services: ServiceDto[],
  signal?: AbortSignal,
): Promise<CollectionDto[]> {
  const results = await Promise.allSettled(
    services.map((service) => getCollectionsByService(service.id, 1, { signal })),
  )
  return results.flatMap((result) => (result.status === 'fulfilled' ? result.value.slice(0, 1) : []))
}

/** Busca em paralelo tudo que o dashboard precisa (janela padrão: últimas 24 h). */
export async function getDashboardData(
  signal?: AbortSignal,
  period: EmissionsPeriod = getLast24Hours(),
): Promise<DashboardData> {
  const [regions, services, emissions, serviceEmissions, summary] = await Promise.all([
    getRegions({ signal }),
    getServices({ signal }),
    getEmissionsByRegion(period, { signal }),
    getEmissionsByService(period, { signal }),
    getSummary(period, { signal }),
  ])
  const latestCollections = await getLatestCollections(services, signal)
  return { regions, services, emissions, serviceEmissions, latestCollections, summary }
}
