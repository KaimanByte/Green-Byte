import type {
  RegionDto,
  RegionEmissionsDto,
  ServiceDto,
  ServiceEmissionsDto,
} from '../types/api'
import { getEmissionsByRegion, getEmissionsByService, getLast24Hours } from './collectionsService'
import { getRegions } from './regionsService'
import { getServices } from './servicesService'

/** Conjunto de dados consumido pelo dashboard, carregado de uma só vez. */
export type DashboardData = {
  regions: RegionDto[]
  services: ServiceDto[]
  emissions: RegionEmissionsDto[]
  serviceEmissions: ServiceEmissionsDto[]
}

/** Busca em paralelo tudo que o dashboard precisa (janela: últimas 24 h). */
export async function getDashboardData(signal?: AbortSignal): Promise<DashboardData> {
  const period = getLast24Hours()
  const [regions, services, emissions, serviceEmissions] = await Promise.all([
    getRegions({ signal }),
    getServices({ signal }),
    getEmissionsByRegion(period, { signal }),
    getEmissionsByService(period, { signal }),
  ])
  return { regions, services, emissions, serviceEmissions }
}
