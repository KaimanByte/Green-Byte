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
 * - Serviços `unavailable` ou `no_metrics` têm `energyKwh = 0`, `co2Emissions = 0` e
 *   `collectionsCount = 0` (não entram com dados parciais, conforme docs/calculos.md §2.5).
 * - Ordem do ranking: `active` primeiro em ordem decrescente da métrica solicitada,
 *   depois `no_metrics`, depois `unavailable`. Empates são resolvidos por `serviceId`
 *   crescente (determinístico). `rank` vai de 1 a N.
 */
@Injectable()
export class RankingCompareCalculator {
  constructor(private readonly indicatorsCalculator: EnvironmentIndicatorsCalculator) {}

  buildItem(service: ServiceSnapshot, totals?: ServicePeriodTotals): ServiceImpactItemDto | null {
    const state = this.indicatorsCalculator.classify(service, totals);
    if (state === 'removed') {
      return null;
    }

    const active = state === 'active' && totals !== undefined;

    return {
      serviceId: service.id,
      name: service.name ?? service.id,
      regionCode: service.regionCode ?? '',
      state,
      collectionsCount: active ? totals.collectionsCount : 0,
      energyKwh: active ? totals.totalEnergyKwh : 0,
      co2Emissions: active ? totals.totalCo2Emissions : 0,
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
      const stateDiff = STATE_PRIORITY[a.state] - STATE_PRIORITY[b.state];
      if (stateDiff !== 0) {
        return stateDiff;
      }
      const valueA = metric === 'energia' ? a.energyKwh : a.co2Emissions;
      const valueB = metric === 'energia' ? b.energyKwh : b.co2Emissions;
      if (valueB !== valueA) {
        return valueB - valueA;
      }
      return a.serviceId.localeCompare(b.serviceId);
    });

    return items.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }
}

