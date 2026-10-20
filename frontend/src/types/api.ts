// Contratos de resposta da API do backend (NestJS).
// Espelham os DTOs em backend/src/modules/*/dto — mantenha-os sincronizados.

/** GET /regions e GET /regions/:codigoRegiao — RegiaoResponseDto */
export type RegionDto = {
  regionCode: string
  country: string
  region: string
  city: string | null
  latitude: number
  longitude: number
  /** gCO₂e/kWh */
  carbonIntensity: number
  /** % de fontes renováveis na matriz elétrica */
  renewableSharePercent: number
}

export type ServiceLocationDto = {
  country: string
  region: string
  city: string | null
  latitude: number | null
  longitude: number | null
}

/** GET /services e GET /services/:id — ServiceResponseDto */
export type ServiceDto = {
  id: string
  name: string
  status: string
  regionCode: string
  location: ServiceLocationDto
  metricsPath: string | null
}

/** GET /collections/emissions/region — RegionEmissionsDto */
export type RegionEmissionsDto = {
  regionCode: string
  /** kWh */
  totalEnergyKwh: number
  /** gCO₂e */
  totalCo2Emissions: number
}

/** GET /collections/emissions/service — ServiceEmissionsDto */
export type ServiceEmissionsDto = {
  serviceId: string
  /** kWh */
  totalEnergyKwh: number
  /** gCO₂e */
  totalCo2Emissions: number
}

/** GET /collections/service/:serviceId — CollectionResponseDto (timestamp chega como string ISO no JSON) */
export type CollectionDto = {
  id: number
  serviceId: string
  timestamp: string
  cpuPercent: number
  memoryGb: number
  diskGb: number
  energyKwh: number
  co2Emissions: number
}

/** Janela de tempo (ISO 8601) aceita pelos endpoints de emissões. */
export type EmissionsPeriod = {
  start: Date
  end: Date
}
