import { Injectable } from '@nestjs/common';
import { EnvironmentIndicatorsCalculator } from './environment-indicators.calculator';
import type {
  RankingMetric,
  ServiceIndicatorState,
  ServicePeriodTotals,
  ServiceSnapshot,
} from './environment-indicators.types';
import { RankedServiceItemDto, ServiceImpactItemDto } from './dto/ranking-compare.dto';

const STATE_PRIORITY: Record<ServiceIndicatorState, number> = {
  active: 0,
  no_metrics: 1,
  unavailable: 2,
};

/**
 * Monta e ordena itens de ranking e comparação (RF14 / RF15, função pura).
 *
 * REGRA NO RANKING E COMPARAÇÃO:
 * - Serviços `removed` são excluídos do ranking.
 * - `state` é o estado atual (última tentativa de coleta). Os valores são os totais medidos no
 *   período, qualquer que seja o estado: um serviço indisponível agora mantém o que já consumiu.
 *   Sem coletas válidas no período, energia, CO₂e e coletas valem 0.
 * - Ordem do ranking: decrescente pela métrica solicitada; empates por estado (`active`,
 *   `no_metrics`, `unavailable`) e depois por `serviceId` crescente (determinístico).
 *   `rank` vai de 1 a N.
 */
@Injectable()
export class RankingCompareCalculator {
  constructor(private readonly indicatorsCalculator: EnvironmentIndicatorsCalculator) {}

  buildItem(service: ServiceSnapshot, totals?: ServicePeriodTotals): ServiceImpactItemDto | null {
    const state = this.indicatorsCalculator.classify(service, totals);
    if (state === 'removed') {
      return null;
    }

    const usable = this.indicatorsCalculator.usableTotals(service, totals);

    return {
      serviceId: service.id,
      name: service.name ?? service.id,
      regionCode: service.regionCode ?? '',
      state,
      collectionsCount: usable ? usable.collectionsCount : 0,
      energyKwh: usable ? usable.totalEnergyKwh : 0,
      co2Emissions: usable ? usable.totalCo2Emissions : 0,
    };
  }

  rank(
    metric: RankingMetric,
    services: ServiceSnapshot[],
    totals: ServicePeriodTotals[],
  ): RankedServiceItemDto[] {
    const byService = new Map(totals.map((t) => [t.serviceId, t]));
    const items: ServiceImpactItemDto[] = [];

    for (const service of services) {
      const item = this.buildItem(service, byService.get(service.id));
      if (item) {
        items.push(item);
      }
    }

    items.sort((a, b) => {
      const valueA = metric === 'energia' ? a.energyKwh : a.co2Emissions;
      const valueB = metric === 'energia' ? b.energyKwh : b.co2Emissions;
      if (valueB !== valueA) {
        return valueB - valueA;
      }
      const stateDiff = STATE_PRIORITY[a.state] - STATE_PRIORITY[b.state];
      if (stateDiff !== 0) {
        return stateDiff;
      }
      return a.serviceId.localeCompare(b.serviceId);
    });

    return items.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }
}

