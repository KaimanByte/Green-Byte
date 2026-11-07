import { BadRequestException, Injectable } from '@nestjs/common';
import { ServicesRepository } from '../services/services.repository';
import { CollectionsRepository } from './collections.repository';
import { EnvironmentIndicatorsCalculator } from './environment-indicators.calculator';
import { EnvironmentIndicators, IndicatorsPeriod } from './environment-indicators.types';

const DEFAULT_PERIOD_MS = 24 * 60 * 60 * 1000;

/**
 * Orquestra a busca de dados e delega a agregação ao calculador (SRP).
 * Pronto para ser consumido por `/summary` (API-03); sem rota HTTP nesta issue.
 */
@Injectable()
export class EnvironmentIndicatorsService {
  constructor(
    private readonly collectionsRepository: CollectionsRepository,
    private readonly servicesRepository: ServicesRepository,
    private readonly calculator: EnvironmentIndicatorsCalculator,
  ) {}

  /**
   * Período padrão: últimas 24h. Sem `to` → agora; sem `from` → `to` menos 24h.
   * O período efetivamente usado é sempre devolvido na resposta.
   */
  async getEnvironmentIndicators(from?: Date, to?: Date): Promise<EnvironmentIndicators> {
    const period = this.resolvePeriod(from, to);

    const [services, totals] = await Promise.all([
      this.servicesRepository.findAll(),
      this.collectionsRepository.getServicePeriodTotals(period.from, period.to),
    ]);

    return this.calculator.calculate(period, services, totals);
  }

  private resolvePeriod(from?: Date, to?: Date): IndicatorsPeriod {
    if ((from && isNaN(from.getTime())) || (to && isNaN(to.getTime()))) {
      throw new BadRequestException('Datas "from" e "to" devem ser válidas (ISO 8601).');
    }

    const end = to ?? new Date();
    const start = from ?? new Date(end.getTime() - DEFAULT_PERIOD_MS);

    if (start.getTime() > end.getTime()) {
      throw new BadRequestException('"from" não pode ser posterior a "to".');
    }

    return { from: start, to: end };
  }
}

