import type { RegionDto, ServiceDto, ServiceEmissionsDto } from '../types/api'
import type { RegionView, ServiceView } from '../types/views'
import { RegionViewFactory } from './RegionViewFactory'
import { ServiceViewFactory } from './ServiceViewFactory'

export type ServiceViewsInput = {
  services: readonly ServiceDto[]
  regions: readonly RegionDto[]
  serviceEmissions: readonly ServiceEmissionsDto[]
}

const toKey = (value: string): string => value.trim().toLowerCase()

const regionFactory = new RegionViewFactory()
const serviceFactory = new ServiceViewFactory()

/**
 * Monta a lista de serviços da tela inicial: relaciona cada `ServiceDto` com sua região
 * e suas emissões (por chave) e delega a construção à `ServiceViewFactory`.
 * Ordem alfabética (pt-BR) para uma listagem estável entre atualizações.
 */
export function createServiceViews({
  services,
  regions,
  serviceEmissions,
}: ServiceViewsInput): ServiceView[] {
  const regionsByCode = new Map<string, RegionView>(
    regionFactory.createViews(regions).map((region) => [toKey(region.code), region]),
  )
  const emissionsByService = new Map<string, ServiceEmissionsDto>(
    serviceEmissions.map((emissions) => [toKey(emissions.serviceId), emissions]),
  )

  return serviceFactory
    .createViews(
      services.map((service) => ({
        service,
        region: regionsByCode.get(toKey(service.regionCode)),
        emissions: emissionsByService.get(toKey(service.id)),
      })),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}
