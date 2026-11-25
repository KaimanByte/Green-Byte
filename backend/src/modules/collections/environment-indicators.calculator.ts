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
 * ESTADO DE CADA SERVIÇO (determinístico) — é o estado ATUAL, da última tentativa de coleta:
 * 1. Serviços com status `removed` são ignorados (não entram em nenhuma contagem).
 * 2. Se a última coleta falhou porque a fonte não respondeu → "indisponível"
 *    (também vale para o status legado `unavailable`).
 * 3. Se a última coleta veio sem números utilizáveis → "sem métricas".
 * 4. Se a última coleta deu certo → "ativo".
 * 5. Serviço que ainda não teve nenhuma tentativa de coleta (recém-cadastrado): "ativo" se já
 *    tiver coleta válida no período, senão "sem métricas".
 *
 * TOTAIS DO PERÍODO: somam todo serviço (não removido) com coletas válidas no período, qualquer
 * que seja o estado atual. Um serviço que ficou indisponível agora continua com o consumo e a
 * emissão que já tinha sido medido; a falha de um ciclo não apaga o histórico.
 * Totais inválidos (NaN/Infinity/negativo) nunca entram, então as somas nunca viram NaN.
 */
@Injectable()
export class EnvironmentIndicatorsCalculator {
  classify(service: ServiceSnapshot, totals?: ServicePeriodTotals): ServiceIndicatorState | 'removed' {
    if (service.status === REMOVED_STATUS) {
      return 'removed';
    }
    if (service.lastCollectionState === 'unavailable' || service.status === UNAVAILABLE_STATUS) {
      return 'unavailable';
    }
    if (service.lastCollectionState === 'no_metrics') {
      return 'no_metrics';
    }
    if (service.lastCollectionState === 'active') {
      return 'active';
    }
    return this.hasValidTotals(totals) ? 'active' : 'no_metrics';
  }

  /** Totais que entram nas somas e no ranking: válidos e de serviço não removido. */
  usableTotals(service: ServiceSnapshot, totals?: ServicePeriodTotals): ServicePeriodTotals | null {
    return service.status !== REMOVED_STATUS && this.hasValidTotals(totals) ? totals : null;
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

      const usable = this.usableTotals(service, serviceTotals);
      if (usable) {
        result.totalEnergyKwh += usable.totalEnergyKwh;
        result.totalCo2Emissions += usable.totalCo2Emissions;
      }

      if (state === 'active') {
        result.activeServices += 1;
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

