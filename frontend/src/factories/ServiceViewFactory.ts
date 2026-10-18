import { formatCo2Emissions, formatEnergyKwh, NO_VALUE_LABEL } from '../lib/formatters'
import type { ServiceDto, ServiceEmissionsDto } from '../types/api'
import type { RegionView, ServiceView } from '../types/views'
import { ViewFactory } from './ViewFactory'

/** Tudo o que é necessário para montar um serviço: o DTO e seus dados relacionados (opcionais). */
export type ServiceViewSource = {
  service: ServiceDto
  region?: RegionView
  emissions?: ServiceEmissionsDto
}

const STATUS_LABELS: ReadonlyMap<string, string> = new Map([['registered', 'Registrado']])
const UNKNOWN_STATUS_LABEL = 'Status desconhecido'
const UNKNOWN_LOCATION_LABEL = 'Localização não informada'

function getStatusLabel(status: string): string {
  const normalized = status.trim()
  if (!normalized) return UNKNOWN_STATUS_LABEL
  return STATUS_LABELS.get(normalized.toLowerCase()) ?? normalized
}

function getLocationLabel(location: ServiceDto['location']): string {
  const parts = [location.city, location.region, location.country]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
  return parts.length > 0 ? parts.join(' · ') : UNKNOWN_LOCATION_LABEL
}

/** Constrói `ServiceView` a partir de `ServiceDto` + região + emissões, com fallbacks seguros. */
export class ServiceViewFactory extends ViewFactory<ServiceViewSource, ServiceView> {
  createView({ service, region, emissions }: ServiceViewSource): ServiceView {
    const hasMetrics =
      emissions !== undefined &&
      Number.isFinite(emissions.totalEnergyKwh) &&
      Number.isFinite(emissions.totalCo2Emissions)

    return {
      id: service.id,
      name: service.name.trim() || service.id,
      statusLabel: getStatusLabel(service.status),
      regionCode: service.regionCode,
      locationLabel: getLocationLabel(service.location),
      carbonLevel: region?.carbonLevel ?? null,
      energyLabel:
        hasMetrics && emissions ? formatEnergyKwh(emissions.totalEnergyKwh) : NO_VALUE_LABEL,
      emissionsLabel:
        hasMetrics && emissions ? formatCo2Emissions(emissions.totalCo2Emissions) : NO_VALUE_LABEL,
      hasMetrics,
    }
  }
}
