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
    totals('svc-unavail', 5, 99, 9999), // indisponível agora, mas mantém o que mediu no período
  ];

  it('ordena decrescentemente por energia e desempata por estado e serviceId', () => {
    const ranked = calculator.rank('energia', services, periodTotals);

    expect(ranked.map((r) => ({ id: r.serviceId, rank: r.rank, state: r.state, energy: r.energyKwh }))).toEqual([
      { id: 'svc-unavail', rank: 1, state: 'unavailable', energy: 99 },
      { id: 'svc-c', rank: 2, state: 'active', energy: 25 },
      { id: 'svc-a', rank: 3, state: 'active', energy: 10 },
      { id: 'svc-b', rank: 4, state: 'active', energy: 10 },
      { id: 'svc-empty', rank: 5, state: 'no_metrics', energy: 0 },
    ]);
  });

  it('ordena decrescentemente por co2e e exclui serviços removed', () => {
    const ranked = calculator.rank('co2e', services, periodTotals);

    expect(ranked.map((r) => r.serviceId)).toEqual([
      'svc-unavail',
      'svc-a',
      'svc-b',
      'svc-c',
      'svc-empty',
    ]);
    expect(ranked.find((r) => r.serviceId === 'svc-removed')).toBeUndefined();
    // sem coletas no período: zerado, nunca inventado
    expect(ranked[4]).toMatchObject({
      serviceId: 'svc-empty',
      collectionsCount: 0,
      energyKwh: 0,
      co2Emissions: 0,
    });
  });

  it('usa fallback para name e regionCode ausentes, lida com listas vazias, apenas removed e período sem coletas', () => {
    expect(calculator.buildItem({ id: 'raw-svc', status: 'active' }, totals('raw-svc', 1, 2, 3))).toEqual({
      serviceId: 'raw-svc',
      name: 'raw-svc',
      regionCode: '',
      state: 'active',
      collectionsCount: 1,
      energyKwh: 2,
      co2Emissions: 3,
    });

    expect(calculator.rank('energia', [], [])).toEqual([]);
    expect(calculator.rank('co2e', [{ id: 'gone', status: 'removed' }], [])).toEqual([]);

    const noTotals = calculator.rank(
      'energia',
      [
        { id: 'svc-z', status: 'registered' },
        { id: 'svc-a', status: 'registered' },
      ],
      [],
    );
    expect(noTotals.map((r) => ({ id: r.serviceId, rank: r.rank, state: r.state, energy: r.energyKwh }))).toEqual([
      { id: 'svc-a', rank: 1, state: 'no_metrics', energy: 0 },
      { id: 'svc-z', rank: 2, state: 'no_metrics', energy: 0 },
    ]);
  });
});

describe('RankingCompareService', () => {
  const catalog: Service[] = [
    { id: 'svc-1', name: 'API 1', regionCode: 'br-sudeste', status: 'active', lastCollectionState: null, lastCollectionAttemptAt: null, lastCollectionError: null },
    { id: 'svc-2', name: 'API 2', regionCode: 'br-sul', status: 'registered', lastCollectionState: null, lastCollectionAttemptAt: null, lastCollectionError: null },
    { id: 'svc-3', name: 'API 3', regionCode: 'us-east', status: 'unavailable', lastCollectionState: null, lastCollectionAttemptAt: null, lastCollectionError: null },
    { id: 'svc-gone', name: 'Gone', regionCode: 'br-sul', status: 'removed', lastCollectionState: null, lastCollectionAttemptAt: null, lastCollectionError: null },
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

  it('aplica período padrão de 24h quando from/to são omitidos e rejeita intervalo invertido/inválido', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-10T12:00:00.000Z'));
    try {
      const rankingRes = await service.getRanking('energia');
      expect(rankingRes.period).toEqual({
        from: '2026-10-09T12:00:00.000Z',
        to: '2026-10-10T12:00:00.000Z',
      });

      const compareRes = await service.compareServices(['svc-1', 'svc-2']);
      expect(compareRes.period).toEqual({
        from: '2026-10-09T12:00:00.000Z',
        to: '2026-10-10T12:00:00.000Z',
      });
    } finally {
      jest.useRealTimers();
    }

    await expect(service.getRanking('co2e', new Date(TO), new Date(FROM))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.compareServices(['svc-1', 'svc-2'], new Date(TO), new Date(FROM)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('propaga falha lançada pelos repositórios no ranking e na comparação', async () => {
    findAll.mockRejectedValueOnce(new Error('Falha no catálogo'));
    await expect(service.getRanking('co2e', new Date(FROM), new Date(TO))).rejects.toThrow('Falha no catálogo');

    getServicePeriodTotals.mockRejectedValueOnce(new Error('Falha ao agregar coletas'));
    await expect(
      service.compareServices(['svc-1', 'svc-2'], new Date(FROM), new Date(TO)),
    ).rejects.toThrow('Falha ao agregar coletas');
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

