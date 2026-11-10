import { Injectable } from '@nestjs/common';
import { ServicesRepository } from '../services/services.repository';
import { CollectionsRepository } from './collections.repository';
import { EnvironmentIndicatorsCalculator } from './environment-indicators.calculator';
import { EnvironmentIndicators } from './environment-indicators.types';
import { resolvePeriod } from './period';

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
    const period = resolvePeriod(from, to);

    const [services, totals] = await Promise.all([
      this.servicesRepository.findAll(),
      this.collectionsRepository.getServicePeriodTotals(period.from, period.to),
    ]);

    return this.calculator.calculate(period, services, totals);
  }
}

