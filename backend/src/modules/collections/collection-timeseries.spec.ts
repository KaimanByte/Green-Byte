import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CollectionTimeSeriesService,
  MAX_COMPARE_SERIES,
  MIN_BUCKET_SECONDS,
  parseBucketSecondsParam,
  resolveBucketSeconds,
} from './collection-timeseries.service';
import { CollectionTimeSeriesController } from './collection-timeseries.controller';
import { CollectionsRepository, ServiceTimeSeriesRow, TimeSeriesRow } from './collections.repository';
import { ServicesRepository } from '../services/services.repository';
import { Service } from '../services/services.schema';

const FROM = '2026-10-01T00:00:00.000Z';
const TO = '2026-10-02T00:00:00.000Z';

const row = (iso: string, co2: number): TimeSeriesRow => ({
  bucket: new Date(iso),
  collectionsCount: 2,
  servicesCount: 1,
  cpuPercent: 50,
  memoryGb: 3,
  diskGb: 18,
  energyKwh: 0.001,
  co2Emissions: co2,
});

describe('bucketSeconds helpers', () => {
  it('parseBucketSecondsParam aceita inteiro >= 30 e undefined quando ausente', () => {
    expect(parseBucketSecondsParam(undefined)).toBeUndefined();
    expect(parseBucketSecondsParam('')).toBeUndefined();
    expect(parseBucketSecondsParam('30')).toBe(30);
    expect(parseBucketSecondsParam('900')).toBe(900);
  });

  it.each(['0', '29', '-60', '1.5', 'abc'])('parseBucketSecondsParam rejeita "%s"', (value) => {
    expect(() => parseBucketSecondsParam(value)).toThrow(BadRequestException);
  });

  it('resolveBucketSeconds divide o período em ~120 intervalos', () => {
    // 24h / 120 = 720 s
    expect(resolveBucketSeconds(new Date(FROM), new Date(TO))).toBe(720);
  });

  it('resolveBucketSeconds nunca fica abaixo do intervalo de coleta', () => {
    const from = new Date(FROM);
    const to = new Date(from.getTime() + 10 * 60_000); // 10 min / 120 = 5 s
    expect(resolveBucketSeconds(from, to)).toBe(MIN_BUCKET_SECONDS);
  });

  it('resolveBucketSeconds respeita o valor pedido e rejeita intervalos demais', () => {
    expect(resolveBucketSeconds(new Date(FROM), new Date(TO), 3600)).toBe(3600);
    // 24h em blocos de 30 s = 2880 intervalos > 1000
    expect(() => resolveBucketSeconds(new Date(FROM), new Date(TO), 30)).toThrow(BadRequestException);
  });
});

describe('CollectionTimeSeriesService', () => {
  let findById: jest.Mock<(id: string) => Promise<Service | null>>;
  let getTimeSeries: jest.Mock<CollectionsRepository['getTimeSeries']>;
  let service: CollectionTimeSeriesService;
  const existing: Service = { id: 'svc-1', name: 'S', regionCode: 'r', status: 'registered' };

  beforeEach(() => {
    findById = jest.fn<(id: string) => Promise<Service | null>>().mockResolvedValue(existing);
    getTimeSeries = jest.fn<CollectionsRepository['getTimeSeries']>().mockResolvedValue([]);
    service = new CollectionTimeSeriesService(
      { findById } as unknown as ServicesRepository,
      { getTimeSeries } as unknown as CollectionsRepository,
    );
  });

  it('devolve as médias por intervalo, em ordem, com período, unidades e agregação explícitos', async () => {
    getTimeSeries.mockResolvedValue([row('2026-10-01T10:00:00Z', 0.05), row('2026-10-01T10:12:00Z', 0.02)]);

    const result = await service.getTimeSeries(new Date(FROM), new Date(TO), 'svc-1', 720);

    expect(getTimeSeries).toHaveBeenCalledWith(new Date(FROM), new Date(TO), 720, 'svc-1');
    expect(result).toMatchObject({
      serviceId: 'svc-1',
      period: { from: FROM, to: TO },
      bucketSeconds: 720,
      aggregation: 'avg',
      units: { co2Emissions: 'gCO2e', energyKwh: 'kWh', cpuPercent: '%' },
      total: 2,
    });
    expect(result.points.map((p) => p.timestamp)).toEqual([
      '2026-10-01T10:00:00.000Z',
      '2026-10-01T10:12:00.000Z',
    ]);
    // o segundo ponto é menor que o primeiro: a série não é acumulada
    expect(result.points[1].co2Emissions).toBeLessThan(result.points[0].co2Emissions);
  });

  it('sem serviceId agrega todos os serviços e não consulta o cadastro', async () => {
    const result = await service.getTimeSeries(new Date(FROM), new Date(TO));

    expect(findById).not.toHaveBeenCalled();
    expect(getTimeSeries).toHaveBeenCalledWith(new Date(FROM), new Date(TO), 720, undefined);
    expect(result.serviceId).toBeNull();
  });

  it('sem coletas devolve série vazia (total 0)', async () => {
    const result = await service.getTimeSeries(new Date(FROM), new Date(TO));
    expect(result.total).toBe(0);
    expect(result.points).toEqual([]);
  });

  it('serviço inexistente ou removido → 404', async () => {
    findById.mockResolvedValueOnce(null);
    await expect(service.getTimeSeries(new Date(FROM), new Date(TO), 'nope')).rejects.toThrow(NotFoundException);

    findById.mockResolvedValueOnce({ ...existing, status: 'removed' });
    await expect(service.getTimeSeries(new Date(FROM), new Date(TO), 'svc-1')).rejects.toThrow(NotFoundException);
    expect(getTimeSeries).not.toHaveBeenCalled();
  });

  it('from posterior a to → 400', async () => {
    await expect(service.getTimeSeries(new Date(TO), new Date(FROM))).rejects.toThrow(BadRequestException);
  });
});

describe('CollectionTimeSeriesController', () => {
  it('converte os query params e repassa ao serviço', async () => {
    const getTimeSeries = jest
      .fn<CollectionTimeSeriesService['getTimeSeries']>()
      .mockResolvedValue({} as Awaited<ReturnType<CollectionTimeSeriesService['getTimeSeries']>>);
    const controller = new CollectionTimeSeriesController({ getTimeSeries } as unknown as CollectionTimeSeriesService);

    await controller.getTimeSeries(FROM, TO, ' svc-1 ', '900');
    expect(getTimeSeries).toHaveBeenCalledWith(new Date(FROM), new Date(TO), 'svc-1', 900);

    await controller.getTimeSeries(undefined, undefined, '', undefined);
    expect(getTimeSeries).toHaveBeenLastCalledWith(undefined, undefined, undefined, undefined);
  });

  it('bucketSeconds inválido → 400 antes de consultar', async () => {
    const getTimeSeries = jest.fn<CollectionTimeSeriesService['getTimeSeries']>();
    const controller = new CollectionTimeSeriesController({ getTimeSeries } as unknown as CollectionTimeSeriesService);

    await expect(controller.getTimeSeries(FROM, TO, undefined, '10')).rejects.toThrow(BadRequestException);
    expect(getTimeSeries).not.toHaveBeenCalled();
  });
});

describe('CollectionTimeSeriesService.compareTimeSeries', () => {
  const catalog: Service[] = [
    { id: 'billing-api', name: 'Billing', regionCode: 'BR', status: 'active' },
    { id: 'auth-api', name: 'Auth', regionCode: 'US', status: 'active' },
    { id: 'payment-api', name: 'Payment', regionCode: 'EU', status: 'active' },
    { id: 'old-api', name: 'Old', regionCode: 'EU', status: 'removed' },
  ];
  const svcRow = (serviceId: string, iso: string, co2: number): ServiceTimeSeriesRow => ({
    ...row(iso, co2),
    serviceId,
  });

  let findAll: jest.Mock<() => Promise<Service[]>>;
  let getTimeSeriesByService: jest.Mock<CollectionsRepository['getTimeSeriesByService']>;
  let service: CollectionTimeSeriesService;

  beforeEach(() => {
    findAll = jest.fn<() => Promise<Service[]>>().mockResolvedValue(catalog);
    getTimeSeriesByService = jest
      .fn<CollectionsRepository['getTimeSeriesByService']>()
      .mockResolvedValue([]);
    service = new CollectionTimeSeriesService(
      { findAll } as unknown as ServicesRepository,
      { getTimeSeriesByService } as unknown as CollectionsRepository,
    );
  });

  it('separa uma série por serviço, na ordem dos ids, sem somar serviços nem acumular', async () => {
    getTimeSeriesByService.mockResolvedValue([
      svcRow('auth-api', '2026-10-01T10:00:00Z', 0.3),
      svcRow('auth-api', '2026-10-01T10:15:00Z', 0.1),
      svcRow('billing-api', '2026-10-01T10:00:00Z', 0.05),
      svcRow('billing-api', '2026-10-01T10:15:00Z', 0.02),
      svcRow('billing-api', '2026-10-01T10:30:00Z', 0.04),
    ]);

    const result = await service.compareTimeSeries(['billing-api', 'auth-api'], new Date(FROM), new Date(TO), 900);

    expect(getTimeSeriesByService).toHaveBeenCalledWith(new Date(FROM), new Date(TO), 900, ['billing-api', 'auth-api']);
    expect(result).toMatchObject({ bucketSeconds: 900, aggregation: 'avg', total: 2 });
    expect(result.units.co2Emissions).toBe('gCO2e');
    expect(result.series.map((s) => [s.serviceId, s.name, s.total])).toEqual([
      ['billing-api', 'Billing', 3],
      ['auth-api', 'Auth', 2],
    ]);
    // valores exatamente como vieram do banco: sobem e descem, nada é somado
    expect(result.series[0].points.map((p) => p.co2Emissions)).toEqual([0.05, 0.02, 0.04]);
    expect(result.series[1].points.map((p) => p.co2Emissions)).toEqual([0.3, 0.1]);
  });

  it('mantém cada série em ordem cronológica mesmo se as linhas vierem fora de ordem', async () => {
    getTimeSeriesByService.mockResolvedValue([
      svcRow('billing-api', '2026-10-01T10:30:00Z', 3),
      svcRow('billing-api', '2026-10-01T10:00:00Z', 1),
      svcRow('billing-api', '2026-10-01T10:15:00Z', 2),
    ]);

    const result = await service.compareTimeSeries(['billing-api', 'auth-api'], new Date(FROM), new Date(TO), 900);

    expect(result.series[0].points.map((p) => p.timestamp)).toEqual([
      '2026-10-01T10:00:00.000Z',
      '2026-10-01T10:15:00.000Z',
      '2026-10-01T10:30:00.000Z',
    ]);
  });

  it('serviço sem coletas no período vem com série vazia, sem zeros inventados', async () => {
    getTimeSeriesByService.mockResolvedValue([svcRow('billing-api', '2026-10-01T10:00:00Z', 0.05)]);

    const result = await service.compareTimeSeries(
      ['billing-api', 'auth-api', 'payment-api'],
      new Date(FROM),
      new Date(TO),
      900,
    );

    expect(result.series.map((s) => s.total)).toEqual([1, 0, 0]);
    expect(result.series[2].points).toEqual([]);
  });

  it('serviço inexistente ou removido → 404 sem consultar coletas', async () => {
    await expect(service.compareTimeSeries(['billing-api', 'nope'])).rejects.toThrow(NotFoundException);
    await expect(service.compareTimeSeries(['billing-api', 'old-api'])).rejects.toThrow(NotFoundException);
    expect(getTimeSeriesByService).not.toHaveBeenCalled();
  });

  it(`mais de ${MAX_COMPARE_SERIES} serviços → 400`, async () => {
    const ids = Array.from({ length: MAX_COMPARE_SERIES + 1 }, (_, i) => `svc-${i}`);
    await expect(service.compareTimeSeries(ids)).rejects.toThrow(BadRequestException);
    expect(findAll).not.toHaveBeenCalled();
  });

  it('período invertido ou intervalos demais → 400', async () => {
    await expect(service.compareTimeSeries(['billing-api', 'auth-api'], new Date(TO), new Date(FROM))).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.compareTimeSeries(['billing-api', 'auth-api'], new Date(FROM), new Date(TO), 30),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('CollectionTimeSeriesController.compareTimeSeries', () => {
  it('aceita ids separados por vírgula ou repetidos, sem duplicar, e repassa os parâmetros', async () => {
    const compareTimeSeries = jest
      .fn<CollectionTimeSeriesService['compareTimeSeries']>()
      .mockResolvedValue({} as Awaited<ReturnType<CollectionTimeSeriesService['compareTimeSeries']>>);
    const controller = new CollectionTimeSeriesController({ compareTimeSeries } as unknown as CollectionTimeSeriesService);

    await controller.compareTimeSeries(' billing-api, auth-api ,billing-api', FROM, TO, '900');
    expect(compareTimeSeries).toHaveBeenCalledWith(['billing-api', 'auth-api'], new Date(FROM), new Date(TO), 900);

    await controller.compareTimeSeries(['billing-api', 'auth-api,payment-api']);
    expect(compareTimeSeries).toHaveBeenLastCalledWith(
      ['billing-api', 'auth-api', 'payment-api'],
      undefined,
      undefined,
      undefined,
    );
  });

  it('menos de 2 serviços distintos ou bucketSeconds inválido → 400 antes de consultar', async () => {
    const compareTimeSeries = jest.fn<CollectionTimeSeriesService['compareTimeSeries']>();
    const controller = new CollectionTimeSeriesController({ compareTimeSeries } as unknown as CollectionTimeSeriesService);

    await expect(controller.compareTimeSeries('billing-api')).rejects.toThrow(BadRequestException);
    await expect(controller.compareTimeSeries('billing-api,billing-api')).rejects.toThrow(BadRequestException);
    await expect(controller.compareTimeSeries('billing-api,auth-api', FROM, TO, '10')).rejects.toThrow(
      BadRequestException,
    );
    expect(compareTimeSeries).not.toHaveBeenCalled();
  });
});
