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
  /** Totais oficiais e estado dos serviços no período (GET /summary), ou `null` se essa fonte falhou. */
  summary: SummaryDto | null
  /** Fontes que falharam nesta carga (nomes legíveis). Vazio quando tudo respondeu. */
  failedSources: string[]
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

/** Nome legível de cada fonte do dashboard (aparece no aviso de carga parcial). */
export const DASHBOARD_SOURCES = {
  regions: 'regiões',
  services: 'serviços',
  emissions: 'emissões por região',
  serviceEmissions: 'emissões por serviço',
  summary: 'resumo do período',
} as const

/** Valor de uma fonte que respondeu, ou `fallback` (registrando o nome da fonte) se falhou. */
function settledOr<T>(result: PromiseSettledResult<T>, fallback: T, source: string, failed: string[]): T {
  if (result.status === 'fulfilled') return result.value
  console.error(`Falha ao carregar ${source}:`, result.reason)
  failed.push(source)
  return fallback
}

/**
 * Busca em paralelo tudo que o dashboard precisa (janela padrão: últimas 24 h).
 * Carga parcial: cada fonte é independente (Promise.allSettled). Se uma falhar, as
 * outras continuam aparecendo e a falha é listada em `failedSources`. Só lança erro
 * se a busca for abortada ou se nenhuma fonte responder.
 */
export async function getDashboardData(
  signal?: AbortSignal,
  period: EmissionsPeriod = getLast24Hours(),
): Promise<DashboardData> {
  const results = await Promise.allSettled([
    getRegions({ signal }),
    getServices({ signal }),
    getEmissionsByRegion(period, { signal }),
    getEmissionsByService(period, { signal }),
    getSummary(period, { signal }),
  ] as const)

  if (signal?.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError')
  const firstFailure = results.find((result) => result.status === 'rejected')
  if (firstFailure && results.every((result) => result.status === 'rejected')) throw firstFailure.reason

  const [regionsResult, servicesResult, emissionsResult, serviceEmissionsResult, summaryResult] = results
  const failedSources: string[] = []
  const regions = settledOr(regionsResult, [], DASHBOARD_SOURCES.regions, failedSources)
  const services = settledOr(servicesResult, [], DASHBOARD_SOURCES.services, failedSources)
  const emissions = settledOr(emissionsResult, [], DASHBOARD_SOURCES.emissions, failedSources)
  const serviceEmissions = settledOr(serviceEmissionsResult, [], DASHBOARD_SOURCES.serviceEmissions, failedSources)
  const summary = settledOr<SummaryDto | null>(summaryResult, null, DASHBOARD_SOURCES.summary, failedSources)

  const latestCollections = await getLatestCollections(services, signal)
  return { regions, services, emissions, serviceEmissions, latestCollections, summary, failedSources }
}
