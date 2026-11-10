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

/** Janela efetiva devolvida pelos endpoints de indicadores (ISO 8601). — PeriodDto */
export type PeriodDto = {
  from: string
  to: string
}

/** GET /summary?from=&to= — SummaryResponseDto */
export type SummaryDto = {
  period: PeriodDto
  units: { energyKwh: 'kWh'; co2Emissions: 'gCO2e' }
  totals: {
    /** kWh — só serviços ativos no período */
    energyKwh: number
    /** gCO₂e — só serviços ativos no período */
    co2Emissions: number
  }
  services: {
    active: number
    unavailable: number
    withoutMetrics: number
  }
}

/** Estado de um serviço no período (backend: ServiceIndicatorState). */
export type ServiceIndicatorState = 'active' | 'unavailable' | 'no_metrics'

/** Métrica aceita por GET /ranking. */
export type RankingMetric = 'energia' | 'co2e'

/** Item de GET /compare — ServiceImpactItemDto */
export type ServiceImpactItemDto = {
  serviceId: string
  name: string
  regionCode: string
  state: ServiceIndicatorState
  collectionsCount: number
  /** kWh — 0 quando indisponível ou sem métricas */
  energyKwh: number
  /** gCO₂e — 0 quando indisponível ou sem métricas */
  co2Emissions: number
}

/** Item de GET /ranking — RankedServiceItemDto (rank 1 = maior impacto) */
export type RankedServiceItemDto = ServiceImpactItemDto & {
  rank: number
}

/** GET /ranking?metric=&from=&to= — RankingResponseDto */
export type RankingDto = {
  metric: RankingMetric
  period: PeriodDto
  units: { energyKwh: 'kWh'; co2Emissions: 'gCO2e' }
  total: number
  items: RankedServiceItemDto[]
}

/** GET /compare?ids=&from=&to= — CompareResponseDto (itens na ordem dos ids pedidos) */
export type CompareDto = {
  period: PeriodDto
  units: { energyKwh: 'kWh'; co2Emissions: 'gCO2e' }
  total: number
  items: ServiceImpactItemDto[]
}

/** Ponto de GET /collections/timeseries — TimeSeriesPointDto (médias das coletas do intervalo) */
export type TimeSeriesPointDto = {
  /** início do intervalo (ISO 8601) */
  timestamp: string
  collectionsCount: number
  servicesCount: number
  /** % (média) */
  cpuPercent: number
  /** GB (média) */
  memoryGb: number
  /** GB (média) */
  diskGb: number
  /** kWh por coleta (média) */
  energyKwh: number
  /** gCO₂e por coleta (média) */
  co2Emissions: number
}

/** GET /collections/timeseries — TimeSeriesResponseDto */
export type TimeSeriesDto = {
  serviceId: string | null
  period: PeriodDto
  bucketSeconds: number
  aggregation: 'avg'
  units: { energyKwh: 'kWh'; co2Emissions: 'gCO2e'; cpuPercent: '%'; memoryGb: 'GB'; diskGb: 'GB' }
  total: number
  /** ordem cronológica; intervalos sem coleta não vêm na resposta */
  points: TimeSeriesPointDto[]
}

/** Série de UM serviço em GET /collections/timeseries/compare — TimeSeriesCompareSeriesDto */
export type TimeSeriesCompareSeriesDto = {
  serviceId: string
  name: string
  regionCode: string
  /** quantidade de pontos; 0 = serviço sem coleta no período */
  total: number
  /** ordem cronológica; só coletas deste serviço; intervalos sem coleta não vêm */
  points: TimeSeriesPointDto[]
}

/** GET /collections/timeseries/compare?ids=&from=&to=&bucketSeconds= — TimeSeriesCompareResponseDto */
export type TimeSeriesCompareDto = {
  period: PeriodDto
  /** igual para todas as séries */
  bucketSeconds: number
  aggregation: 'avg'
  units: TimeSeriesDto['units']
  total: number
  /** uma série por serviço, na ordem dos ids pedidos */
  series: TimeSeriesCompareSeriesDto[]
}

/** Usuário sem a senha — UserResponseDto (createdAt chega como string ISO no JSON) */
export type UserDto = {
  id: number
  email: string
  createdAt: string
}

/** POST /auth/login — LoginResponseDto */
export type LoginResponseDto = {
  /** token JWT para o cabeçalho `Authorization: Bearer` */
  access_token: string
  user: UserDto
}
