import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { CollectionsRepository } from './collections.repository';
import { EnvironmentIndicatorsCalculator } from './environment-indicators.calculator';
import { EnvironmentIndicatorsService } from './environment-indicators.service';
import { ServicePeriodTotals, ServiceSnapshot } from './environment-indicators.types';
import { Service } from '../services/services.schema';
import { ServicesRepository } from '../services/services.repository';

const period = {
  from: new Date('2026-10-01T00:00:00.000Z'),
  to: new Date('2026-10-02T00:00:00.000Z'),
};

const totals = (serviceId: string, count: number, energy: number, co2: number): ServicePeriodTotals => ({
  serviceId,
  collectionsCount: count,
  totalEnergyKwh: energy,
  totalCo2Emissions: co2,
});

describe('EnvironmentIndicatorsCalculator', () => {
  const calculator = new EnvironmentIndicatorsCalculator();

  it('soma consumo e emissão e conta ativos, indisponíveis e sem métricas', () => {
    const services: ServiceSnapshot[] = [
      { id: 'a', status: 'active' },
      { id: 'b', status: 'registered' },
      { id: 'c', status: 'unavailable' },
      { id: 'd', status: 'registered' },
    ];

    const result = calculator.calculate(period, services, [
      totals('a', 3, 1.5, 100),
      totals('b', 1, 0.5, 20),
      totals('c', 2, 9, 900), // indisponível: não entra na soma
    ]);

    expect(result.totalEnergyKwh).toBeCloseTo(2, 10);
    expect(result.totalCo2Emissions).toBeCloseTo(120, 10);
    expect(result.activeServices).toBe(2);
    expect(result.unavailableServices).toBe(1);
    expect(result.servicesWithoutMetrics).toBe(1);
  });

  it('inclui o período considerado na resposta', () => {
    const result = calculator.calculate(period, [], []);

    expect(result.period.from.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(result.period.to.toISOString()).toBe('2026-10-02T00:00:00.000Z');
  });

  it('ambiente sem coletas: totais 0 e todos sem métricas', () => {
    const result = calculator.calculate(
      period,
      [
        { id: 'a', status: 'registered' },
        { id: 'b', status: 'active' },
      ],
      [],
    );

    expect(result.totalEnergyKwh).toBe(0);
    expect(result.totalCo2Emissions).toBe(0);
    expect(result.activeServices).toBe(0);
    expect(result.servicesWithoutMetrics).toBe(2);
  });

  it('ambiente sem serviços retorna tudo zerado', () => {
    const result = calculator.calculate(period, [], []);

    expect(result).toMatchObject({
      totalEnergyKwh: 0,
      totalCo2Emissions: 0,
      activeServices: 0,
      unavailableServices: 0,
      servicesWithoutMetrics: 0,
    });
  });

  it('valores zerados com coleta contam como ativo', () => {
    const result = calculator.calculate(period, [{ id: 'a', status: 'active' }], [totals('a', 4, 0, 0)]);

    expect(result.activeServices).toBe(1);
    expect(result.totalEnergyKwh).toBe(0);
    expect(result.totalCo2Emissions).toBe(0);
  });

  it('totais inválidos (NaN, Infinity, negativo, contagem 0) não distorcem as somas', () => {
    const result = calculator.calculate(
      period,
      [
        { id: 'ok', status: 'active' },
        { id: 'nan', status: 'active' },
        { id: 'inf', status: 'active' },
        { id: 'neg', status: 'active' },
        { id: 'zero', status: 'active' },
      ],
      [
        totals('ok', 1, 1, 10),
        totals('nan', 1, Number.NaN, 5),
        totals('inf', 1, 1, Number.POSITIVE_INFINITY),
        totals('neg', 1, -1, 5),
        totals('zero', 0, 3, 3),
      ],
    );

    expect(result.totalEnergyKwh).toBe(1);
    expect(result.totalCo2Emissions).toBe(10);
    expect(result.activeServices).toBe(1);
    expect(result.servicesWithoutMetrics).toBe(4);
    expect(Number.isNaN(result.totalEnergyKwh)).toBe(false);
  });

  it('ignora serviços removidos e totais de serviços desconhecidos', () => {
    const result = calculator.calculate(
      period,
      [{ id: 'gone', status: 'removed' }],
      [totals('gone', 2, 5, 50), totals('unknown', 1, 1, 1)],
    );

    expect(result.activeServices).toBe(0);
    expect(result.unavailableServices).toBe(0);
    expect(result.servicesWithoutMetrics).toBe(0);
    expect(result.totalEnergyKwh).toBe(0);
  });
});

describe('EnvironmentIndicatorsService', () => {
  const NOW = new Date('2026-10-10T12:00:00.000Z');
  let service: EnvironmentIndicatorsService;
  let findAll: jest.Mock<() => Promise<Service[]>>;
  let getTotals: jest.Mock<(from: Date, to: Date) => Promise<ServicePeriodTotals[]>>;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    findAll = jest.fn<() => Promise<Service[]>>().mockResolvedValue([
      { id: 'a', name: 'A', regionCode: 'r', status: 'active' },
      { id: 'b', name: 'B', regionCode: 'r', status: 'registered' },
    ]);
    getTotals = jest
      .fn<(from: Date, to: Date) => Promise<ServicePeriodTotals[]>>()
      .mockResolvedValue([totals('a', 2, 1, 10)]);

    service = new EnvironmentIndicatorsService(
      { getServicePeriodTotals: getTotals } as unknown as CollectionsRepository,
      { findAll } as unknown as ServicesRepository,
      new EnvironmentIndicatorsCalculator(),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('usa o período informado e o devolve na resposta', async () => {
    const result = await service.getEnvironmentIndicators(period.from, period.to);

    expect(getTotals).toHaveBeenCalledWith(period.from, period.to);
    expect(result.period).toEqual(period);
    expect(result.activeServices).toBe(1);
    expect(result.servicesWithoutMetrics).toBe(1);
    expect(result.totalCo2Emissions).toBe(10);
  });

  it('aplica o padrão de 24h terminando agora quando não informado', async () => {
    const result = await service.getEnvironmentIndicators();

    expect(result.period.to.toISOString()).toBe('2026-10-10T12:00:00.000Z');
    expect(result.period.from.toISOString()).toBe('2026-10-09T12:00:00.000Z');
  });

  it('com apenas "to", from = to menos 24h', async () => {
    const to = new Date('2026-10-05T00:00:00.000Z');

    const result = await service.getEnvironmentIndicators(undefined, to);

    expect(result.period.from.toISOString()).toBe('2026-10-04T00:00:00.000Z');
  });

  it('aceita from igual a to', async () => {
    const instant = new Date('2026-10-05T00:00:00.000Z');

    const result = await service.getEnvironmentIndicators(instant, instant);

    expect(result.period).toEqual({ from: instant, to: instant });
  });

  it('rejeita from posterior a to e datas inválidas', async () => {
    await expect(service.getEnvironmentIndicators(period.to, period.from)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.getEnvironmentIndicators(new Date('x'))).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.getEnvironmentIndicators(undefined, new Date('x'))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(getTotals).not.toHaveBeenCalled();
  });
});

