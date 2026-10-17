import { REGIONS } from './regions'

// mesmo formato dos DTOs do backend (ServiceEmissionsDto / RegionEmissionsDto)
export type ServiceEmission = {
  serviceId: string
  name: string
  regionCode: string
  carbonIntensity: number
  totalEnergyKwh: number
  totalCo2Emissions: number
}

export type RegionEmission = {
  regionCode: string
  city: string
  carbonIntensity: number
  totalEnergyKwh: number
  totalCo2Emissions: number
}

export type HistoryPoint = {
  timestamp: Date
  co2Emissions: number
}

export type DashboardSummary = {
  totalEnergyKwh: number
  totalCo2Emissions: number
  averageIntensity: number
  renewableShare: number
  servicesCount: number
  regionsCount: number
}

//trocar pra chamada ao backend: GET /collections/emissions/service?start=&end=
// energia (kWh) de cada serviço nas últimas 24 h
const ENERGY_BY_SERVICE: Record<string, number> = {
  'Billing API': 1.8,
  'Email Dispatcher': 0.6,
  'Checkout Worker': 2.4,
  'Fraud Detector': 1.5,
  'Recommendation AI': 3.2,
  'Inventory Sync': 0.9,
  'Reporting Batch': 1.2,
  'Audit Stream': 0.7,
}

const toId = (name: string) => name.toLowerCase().replace(/\s+/g, '-')

// CO₂e (g) = energia (kWh) × intensidade da região (gCO₂e/kWh)
export const SERVICE_EMISSIONS: ServiceEmission[] = REGIONS.flatMap((region) =>
  region.services.map((name) => {
    const energy = ENERGY_BY_SERVICE[name] ?? 0
    return {
      serviceId: toId(name),
      name,
      regionCode: region.code,
      carbonIntensity: region.carbonIntensity,
      totalEnergyKwh: energy,
      totalCo2Emissions: energy * region.carbonIntensity,
    }
  }),
).sort((a, b) => b.totalCo2Emissions - a.totalCo2Emissions)

//trocar pra GET /collections/emissions/region?start=&end=
export const REGION_EMISSIONS: RegionEmission[] = REGIONS.map((region) => {
  const services = SERVICE_EMISSIONS.filter((s) => s.regionCode === region.code)
  return {
    regionCode: region.code,
    city: region.city,
    carbonIntensity: region.carbonIntensity,
    totalEnergyKwh: services.reduce((sum, s) => sum + s.totalEnergyKwh, 0),
    totalCo2Emissions: services.reduce((sum, s) => sum + s.totalCo2Emissions, 0),
  }
}).sort((a, b) => b.totalCo2Emissions - a.totalCo2Emissions)

const totalEnergyKwh = SERVICE_EMISSIONS.reduce((sum, s) => sum + s.totalEnergyKwh, 0)
const totalCo2Emissions = SERVICE_EMISSIONS.reduce((sum, s) => sum + s.totalCo2Emissions, 0)

// renovável ponderado pela energia de cada região
const renewableWeighted = REGIONS.reduce((sum, region) => {
  const energy = REGION_EMISSIONS.find((r) => r.regionCode === region.code)?.totalEnergyKwh ?? 0
  return sum + energy * region.renewableShare
}, 0)

export const DASHBOARD_SUMMARY: DashboardSummary = {
  totalEnergyKwh,
  totalCo2Emissions,
  averageIntensity: totalEnergyKwh ? totalCo2Emissions / totalEnergyKwh : 0,
  renewableShare: totalEnergyKwh ? renewableWeighted / totalEnergyKwh : 0,
  servicesCount: SERVICE_EMISSIONS.length,
  regionsCount: REGION_EMISSIONS.filter((r) => r.totalEnergyKwh > 0).length,
}

//trocar pelo histórico real (coletas agrupadas por hora)
// distribui o total do dia numa curva: mais uso à tarde, menos de madrugada
const HOURS = 24
const now = new Date()
now.setMinutes(0, 0, 0)

const weights = Array.from({ length: HOURS }, (_, i) => {
  const hour = (now.getHours() - (HOURS - 1) + i + 24) % 24
  return 1 + 0.55 * Math.sin(((hour - 9) / 24) * 2 * Math.PI) + 0.08 * Math.sin(i * 1.7)
})
const weightSum = weights.reduce((a, b) => a + b, 0)

export const EMISSIONS_HISTORY: HistoryPoint[] = weights.map((weight, i) => ({
  timestamp: new Date(now.getTime() - (HOURS - 1 - i) * 3_600_000),
  co2Emissions: (weight / weightSum) * totalCo2Emissions,
}))

//trocar pelo timestamp da última coleta gravada no banco
export const LAST_COLLECTION_AT: Date = EMISSIONS_HISTORY[EMISSIONS_HISTORY.length - 1].timestamp
