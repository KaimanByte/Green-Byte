/** Estado de um serviço no período consolidado (CA-04). */
export type ServiceIndicatorState = 'active' | 'unavailable' | 'no_metrics';

/** Dados mínimos de um serviço necessários à classificação. */
export interface ServiceSnapshot {
  id: string;
  /** Status persistido em `services.status` (ex.: registered, active, unavailable, removed). */
  status: string;
}

/** Totais de coletas de um serviço no período (saída da camada de persistência). */
export interface ServicePeriodTotals {
  serviceId: string;
  collectionsCount: number;
  totalEnergyKwh: number;
  totalCo2Emissions: number;
}

export interface IndicatorsPeriod {
  from: Date;
  to: Date;
}

export interface EnvironmentIndicators {
  period: IndicatorsPeriod;
  totalEnergyKwh: number;
  totalCo2Emissions: number;
  activeServices: number;
  unavailableServices: number;
  servicesWithoutMetrics: number;
}

