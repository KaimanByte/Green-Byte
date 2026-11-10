import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CollectionsRepository } from './collections.repository';
import { EnvironmentIndicatorsCalculator } from './environment-indicators.calculator';
import type { ServicePeriodTotals, ServiceSnapshot } from './environment-indicators.types';
import { RankingCompareCalculator } from './ranking-compare.calculator';
import { RankingCompareController } from './ranking-compare.controller';
import {
  parseCompareIds,
  parseMetricParam,
  RankingCompareService,
} from './ranking-compare.service';
import { Service } from '../services/services.schema';
import { ServicesRepository } from '../services/services.repository';

const FROM = '2026-10-01T00:00:00.000Z';
const TO = '2026-10-02T00:00:00.000Z';

const totals = (
  serviceId: string,
  count: number,
  energy: number,
  co2: number,
): ServicePeriodTotals => ({
  serviceId,
  collectionsCount: count,
  totalEnergyKwh: energy,
  totalCo2Emissions: co2,
});

describe('parseMetricParam & parseCompareIds', () => {
  it('aceita "energia" e "co2e" e rejeita valores ausentes ou inválidos', () => {
    expect(parseMetricParam('energia')).toBe('energia');
    expect(parseMetricParam('co2e')).toBe('co2e');
    for (const invalid of [undefined, '', 'cpu', 'ENERGIA', 'kwh']) {
      expect(() => parseMetricParam(invalid)).toThrow(BadRequestException);
    }
  });

  it('parseCompareIds aceita lista CSV e array de query params, fazendo trim e deduplicação', () => {
    expect(parseCompareIds(' svc-a , svc-b , svc-a ')).toEqual(['svc-a', 'svc-b']);
    expect(parseCompareIds(['svc-1,svc-2', 'svc-3'])).toEqual(['svc-1', 'svc-2', 'svc-3']);
  });

  it('parseCompareIds lança 400 quando há menos de 2 IDs distintos', () => {
    for (const bad of [undefined, '', '  ,  ', 'svc-1', 'svc-1,svc-1', ['svc-1', ' svc-1 ']]) {
      expect(() => parseCompareIds(bad)).toThrow(BadRequestException);
    }
  });
});

describe('RankingCompareCalculator', () => {
  const calculator = new RankingCompareCalculator(new EnvironmentIndicatorsCalculator());

  const services: ServiceSnapshot[] = [
    { id: 'svc-b', name: 'Service B', regionCode: 'br-sul', status: 'active' },
    { id: 'svc-a', name: 'Service A', regionCode: 'br-sudeste', status: 'active' },
    { id: 'svc-c', name: 'Service C', regionCode: 'us-east', status: 'registered' },
    { id: 'svc-unavail', name: 'Down Service', regionCode: 'eu-west', status: 'unavailable' },
    { id: 'svc-empty', name: 'No Metrics Service', regionCode: 'br-norte', status: 'registered' },
    { id: 'svc-removed', name: 'Removed Service', regionCode: 'br-sul', status: 'removed' },
  ];

  const periodTotals: ServicePeriodTotals[] = [
    totals('svc-b', 4, 10, 500),
    totals('svc-a', 4, 10, 800), // empate em energia com svc-b, maior CO2e
    totals('svc-c', 2, 25, 300), // maior energia, menor CO2e
    totals('svc-unavail', 5, 99, 9999), // indisponível: zerado e no fim
  ];

  it('ordena decrescentemente por energia, desempata por serviceId e posiciona no_metrics/unavailable ao final', () => {
    const ranked = calculator.rank('energia', services, periodTotals);

    expect(ranked.map((r) => ({ id: r.serviceId, rank: r.rank, state: r.state, energy: r.energyKwh }))).toEqual([
      { id: 'svc-c', rank: 1, state: 'active', energy: 25 },
      { id: 'svc-a', rank: 2, state: 'active', energy: 10 },
      { id: 'svc-b', rank: 3, state: 'active', energy: 10 },
      { id: 'svc-empty', rank: 4, state: 'no_metrics', energy: 0 },
      { id: 'svc-unavail', rank: 5, state: 'unavailable', energy: 0 },
    ]);
  });

  it('ordena decrescentemente por co2e e exclui serviços removed', () => {
    const ranked = calculator.rank('co2e', services, periodTotals);

    expect(ranked.map((r) => r.serviceId)).toEqual([
      'svc-a',
      'svc-b',
      'svc-c',
      'svc-empty',
      'svc-unavail',
    ]);
    expect(ranked.find((r) => r.serviceId === 'svc-removed')).toBeUndefined();
    expect(ranked[4]).toMatchObject({
      serviceId: 'svc-unavail',
      collectionsCount: 0,
      energyKwh: 0,
      co2Emissions: 0,
    });
  });
});

describe('RankingCompareService', () => {
  const catalog: Service[] = [
    { id: 'svc-1', name: 'API 1', regionCode: 'br-sudeste', status: 'active' },
    { id: 'svc-2', name: 'API 2', regionCode: 'br-sul', status: 'registered' },
    { id: 'svc-3', name: 'API 3', regionCode: 'us-east', status: 'unavailable' },
    { id: 'svc-gone', name: 'Gone', regionCode: 'br-sul', status: 'removed' },
  ];

  let findAll: jest.Mock<() => Promise<Service[]>>;
  let getServicePeriodTotals: jest.Mock<(from: Date, to: Date) => Promise<ServicePeriodTotals[]>>;
  let service: RankingCompareService;

  beforeEach(() => {
    findAll = jest.fn<() => Promise<Service[]>>().mockResolvedValue(catalog);
    getServicePeriodTotals = jest
      .fn<(from: Date, to: Date) => Promise<ServicePeriodTotals[]>>()
      .mockResolvedValue([totals('svc-1', 3, 2.5, 120), totals('svc-2', 1, 5.0, 60)]);

    service = new RankingCompareService(
      { findAll } as unknown as ServicesRepository,
      { getServicePeriodTotals } as unknown as CollectionsRepository,
      new RankingCompareCalculator(new EnvironmentIndicatorsCalculator()),
    );
  });

  it('getRanking retorna period, units, metric e itens ranqueados', async () => {
    const res = await service.getRanking('co2e', new Date(FROM), new Date(TO));

    expect(getServicePeriodTotals).toHaveBeenCalledWith(new Date(FROM), new Date(TO));
    expect(res.period).toEqual({ from: FROM, to: TO });
    expect(res.units).toEqual({ energyKwh: 'kWh', co2Emissions: 'gCO2e' });
    expect(res.metric).toBe('co2e');
    expect(res.total).toBe(3);
    expect(res.items.map((i) => i.serviceId)).toEqual(['svc-1', 'svc-2', 'svc-3']);
  });

  it('compareServices retorna 2+ serviços no mesmo período preservando a ordem solicitada', async () => {
    const res = await service.compareServices(['svc-2', 'svc-1', 'svc-3'], new Date(FROM), new Date(TO));

    expect(res.period).toEqual({ from: FROM, to: TO });
    expect(res.units).toEqual({ energyKwh: 'kWh', co2Emissions: 'gCO2e' });
    expect(res.total).toBe(3);
    expect(res.items.map((i) => ({ id: i.serviceId, state: i.state, energy: i.energyKwh }))).toEqual([
      { id: 'svc-2', state: 'active', energy: 5 },
      { id: 'svc-1', state: 'active', energy: 2.5 },
      { id: 'svc-3', state: 'unavailable', energy: 0 },
    ]);
  });

  it('compareServices lança 404 para serviço inexistente ou removed', async () => {
    await expect(
      service.compareServices(['svc-1', 'inexistente'], new Date(FROM), new Date(TO)),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.compareServices(['svc-1', 'svc-gone'], new Date(FROM), new Date(TO)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('compareServices lança 400 quando recebe menos de 2 IDs distintos', async () => {
    await expect(service.compareServices(['svc-1'])).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.compareServices(['svc-1', 'svc-1'])).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('RankingCompareController', () => {
  const getRanking = jest.fn<RankingCompareService['getRanking']>();
  const compareServices = jest.fn<RankingCompareService['compareServices']>();
  const controller = new RankingCompareController({
    getRanking,
    compareServices,
  } as unknown as RankingCompareService);

  beforeEach(() => {
    getRanking.mockReset();
    compareServices.mockReset();
  });

  it('GET /ranking valida metric e datas e delega ao serviço', async () => {
    await controller.getRanking('energia', FROM, TO);
    expect(getRanking).toHaveBeenCalledWith('energia', new Date(FROM), new Date(TO));

    await expect(controller.getRanking('invalido', FROM, TO)).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.getRanking('energia', 'data-invalida', TO)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('GET /compare valida ids (>= 2 distintos) e datas antes de delegar', async () => {
    await controller.compare('svc-1,svc-2', FROM, TO);
    expect(compareServices).toHaveBeenCalledWith(['svc-1', 'svc-2'], new Date(FROM), new Date(TO));

    await expect(controller.compare('svc-1', FROM, TO)).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.compare('svc-1,svc-1', FROM, TO)).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.compare('svc-1,svc-2', 'bad-date', TO)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

