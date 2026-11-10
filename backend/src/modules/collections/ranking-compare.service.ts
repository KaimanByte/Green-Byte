import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ServicesRepository } from '../services/services.repository';
import { CollectionsRepository } from './collections.repository';
import { SUMMARY_UNITS } from './dto/history-summary.dto';
import { CompareResponseDto, RankingResponseDto } from './dto/ranking-compare.dto';
import type { RankingMetric } from './environment-indicators.types';
import { resolvePeriod } from './period';
import { RankingCompareCalculator } from './ranking-compare.calculator';

export function parseMetricParam(raw?: string): RankingMetric {
  if (raw === 'energia' || raw === 'co2e') {
    return raw;
  }
  throw new BadRequestException('Parâmetro "metric" obrigatório: use "energia" ou "co2e".');
}

/** Aceita `ids=a,b` e/ou repetição `?ids=a&ids=b`; remove vazios e duplicados preservando a ordem. */
export function parseCompareIds(raw?: string | string[]): string[] {
  const parts = (Array.isArray(raw) ? raw : raw ? [raw] : [])
    .flatMap((entry) => entry.split(','))
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  const unique = Array.from(new Set(parts));
  if (unique.length < 2) {
    throw new BadRequestException('Informe ao menos 2 serviços distintos no parâmetro "ids".');
  }
  return unique;
}

@Injectable()
export class RankingCompareService {
  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly collectionsRepository: CollectionsRepository,
    private readonly calculator: RankingCompareCalculator,
  ) {}

  async getRanking(metric: RankingMetric, from?: Date, to?: Date): Promise<RankingResponseDto> {
    const period = resolvePeriod(from, to);

    const [services, totals] = await Promise.all([
      this.servicesRepository.findAll(),
      this.collectionsRepository.getServicePeriodTotals(period.from, period.to),
    ]);

    const items = this.calculator.rank(metric, services, totals);

    return {
      metric,
      period: { from: period.from.toISOString(), to: period.to.toISOString() },
      units: SUMMARY_UNITS,
      total: items.length,
      items,
    };
  }

  async compareServices(ids: string[], from?: Date, to?: Date): Promise<CompareResponseDto> {
    if (new Set(ids).size < 2) {
      throw new BadRequestException('Informe ao menos 2 serviços distintos para comparação.');
    }

    const period = resolvePeriod(from, to);

    const [services, totals] = await Promise.all([
      this.servicesRepository.findAll(),
      this.collectionsRepository.getServicePeriodTotals(period.from, period.to),
    ]);

    const serviceById = new Map(services.map((s) => [s.id, s]));
    const totalsById = new Map(totals.map((t) => [t.serviceId, t]));

    const items = ids.map((id) => {
      const service = serviceById.get(id);
      const item = service ? this.calculator.buildItem(service, totalsById.get(id)) : null;
      if (!item) {
        throw new NotFoundException(`Serviço "${id}" não encontrado.`);
      }
      return item;
    });

    return {
      period: { from: period.from.toISOString(), to: period.to.toISOString() },
      units: SUMMARY_UNITS,
      total: items.length,
      items,
    };
  }
}

