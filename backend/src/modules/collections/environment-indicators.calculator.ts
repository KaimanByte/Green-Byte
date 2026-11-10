import { Injectable } from '@nestjs/common';
import {
  EnvironmentIndicators,
  IndicatorsPeriod,
  ServicePeriodTotals,
  ServiceIndicatorState,
  ServiceSnapshot,
} from './environment-indicators.types';

const REMOVED_STATUS = 'removed';
const UNAVAILABLE_STATUS = 'unavailable';

/**
 * Agregação matemática e classificação dos indicadores do ambiente (RF08 / CA-04).
 * Função pura: não acessa banco nem relógio.
 *
 * REGRA PARA SERVIÇOS SEM CÁLCULO (determinística):
 * 1. Serviços com status `removed` são ignorados (não entram em nenhuma contagem).
 * 2. Status `unavailable` → "indisponível"; seus dados NÃO entram nas somas
 *    (alinhado a docs/calculos.md §2.5).
 * 3. Demais serviços são "ativos" somente se tiverem ao menos uma coleta no
 *    período E totais válidos (finitos e >= 0). Caso contrário (sem coletas,
 *    recém-registrado, NaN/Infinity/negativo) → "sem métricas".
 * 4. Somente serviços "ativos" contribuem para consumo e emissão total, portanto
 *    as somas nunca produzem NaN/null; sem nenhum ativo os totais valem 0.
 *    Serviço ativo com valores zerados é válido e conta como ativo.
 */
@Injectable()
export class EnvironmentIndicatorsCalculator {
  classify(service: ServiceSnapshot, totals?: ServicePeriodTotals): ServiceIndicatorState | 'removed' {
    if (service.status === REMOVED_STATUS) {
      return 'removed';
    }
    if (service.status === UNAVAILABLE_STATUS) {
      return 'unavailable';
    }
    return this.hasValidTotals(totals) ? 'active' : 'no_metrics';
  }

  calculate(
    period: IndicatorsPeriod,
    services: ServiceSnapshot[],
    totals: ServicePeriodTotals[],
  ): EnvironmentIndicators {
    const totalsByService = new Map(totals.map((t) => [t.serviceId, t]));

    const result: EnvironmentIndicators = {
      period,
      totalEnergyKwh: 0,
      totalCo2Emissions: 0,
      activeServices: 0,
      unavailableServices: 0,
      servicesWithoutMetrics: 0,
    };

    for (const service of services) {
      const serviceTotals = totalsByService.get(service.id);
      const state = this.classify(service, serviceTotals);

      if (state === 'active' && serviceTotals) {
        result.activeServices += 1;
        result.totalEnergyKwh += serviceTotals.totalEnergyKwh;
        result.totalCo2Emissions += serviceTotals.totalCo2Emissions;
      } else if (state === 'unavailable') {
        result.unavailableServices += 1;
      } else if (state === 'no_metrics') {
        result.servicesWithoutMetrics += 1;
      }
    }

    return result;
  }

  private hasValidTotals(totals?: ServicePeriodTotals): totals is ServicePeriodTotals {
    return (
      totals !== undefined &&
      totals.collectionsCount > 0 &&
      Number.isFinite(totals.totalEnergyKwh) &&
      Number.isFinite(totals.totalCo2Emissions) &&
      totals.totalEnergyKwh >= 0 &&
      totals.totalCo2Emissions >= 0
    );
  }
}

