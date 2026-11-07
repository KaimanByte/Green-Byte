import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { EnvironmentIndicators } from './environment-indicators.types';
import { EnvironmentIndicatorsService } from './environment-indicators.service';
import { ServiceHistoryController } from './service-history.controller';
import { ServiceHistoryService } from './service-history.service';
import { SummaryController } from './summary.controller';
import { CollectionResponseDto } from './dto/collection.dto';
import { parseDateParam, parseLimitParam, resolvePeriod } from './period';
import { Service } from '../services/services.schema';
import { ServicesRepository } from '../services/services.repository';

const FROM = '2026-10-01T00:00:00.000Z';
const TO = '2026-10-02T00:00:00.000Z';

const point = (id: number, iso: string): CollectionResponseDto => ({
  id,
  serviceId: 'svc-1',
  timestamp: new Date(iso),
  cpuPercent: 10,
  memoryGb: 1,
  diskGb: 2,
  energyKwh: 0.5,
  co2Emissions: 40,
});

describe('period helpers', () => {
  it('parseDateParam aceita ISO 8601 e retorna undefined quando ausente', () => {
    expect(parseDateParam('from', undefined)).toBeUndefined();
    expect(parseDateParam('from', FROM)?.toISOString()).toBe(FROM);
    expect(parseDateParam('to', '2026-10-01')?.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(parseDateParam('to', '2026-10-01T10:30:00-03:00')?.toISOString()).toBe('2026-10-01T13:30:00.000Z');
    expect(parseDateParam('to', '2026-10-01T10:30')?.toISOString()).toBe('2026-10-01T10:30:00.000Z');
  });

  it.each(['abc', '01/10/2026', '2026-13-01', '2026-02-30', '2026-10-01T25:00:00Z', '1700000000'])(
    'parseDateParam rejeita "%s"',
    (value) => {
      expect(() => parseDateParam('from', value)).toThrow(BadRequestException);
    },
  );

  it('parseLimitParam valida inteiro positivo', () => {
    expect(parseLimitParam(undefined)).toBeUndefined();
    expect(parseLimitParam('50')).toBe(50);
    for (const bad of ['0', '-1', '1.5', 'abc']) {
      expect(() => parseLimitParam(bad)).toThrow(BadRequestException);
    }
  });

  it('resolvePeriod rejeita from > to e aceita from == to', () => {
    expect(() => resolvePeriod(new Date(TO), new Date(FROM))).toThrow(BadRequestException);
    const same = new Date(FROM);
    expect(resolvePeriod(same, same)).toEqual({ from: same, to: same });
  });
});

describe('ServiceHistoryService', () => {
  let findById: jest.Mock<(id: string) => Promise<Service | null>>;
  let findHistory: jest.Mock<CollectionsService['findHistory']>;
  let service: ServiceHistoryService;
  const existing: Service = { id: 'svc-1', name: 'S', regionCode: 'r', status: 'active' };

  beforeEach(() => {
    findById = jest.fn<(id: string) => Promise<Service | null>>().mockResolvedValue(existing);
    findHistory = jest.fn<CollectionsService['findHistory']>().mockResolvedValue([]);
    service = new ServiceHistoryService(
      { findById } as unknown as ServicesRepository,
      { findHistory } as unknown as CollectionsService,
    );
  });

  it('retorna série temporal com período e unidades explícitas', async () => {
    const points = [point(1, '2026-10-01T10:00:00Z'), point(2, '2026-10-01T11:00:00Z')];
    findHistory.mockResolvedValue(points);

    const result = await service.getHistory('svc-1', new Date(FROM), new Date(TO), 10);

    expect(findHistory).toHaveBeenCalledWith({
      serviceId: 'svc-1',
      from: new Date(FROM),
      to: new Date(TO),
      limit: 10,
    });
    expect(result).toEqual({
      serviceId: 'svc-1',
      period: { from: FROM, to: TO },
      units: { energyKwh: 'kWh', co2Emissions: 'gCO2e', cpuPercent: '%', memoryGb: 'GB', diskGb: 'GB' },
      total: 2,
      points,
    });
  });

  it('aplica o período padrão de 24h quando from/to são omitidos', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-10T12:00:00.000Z'));
    try {
      const result = await service.getHistory('svc-1');

      expect(result.period).toEqual({ from: '2026-10-09T12:00:00.000Z', to: '2026-10-10T12:00:00.000Z' });
    } finally {
      jest.useRealTimers();
    }
  });

  it('período sem coletas retorna lista vazia', async () => {
    const result = await service.getHistory('svc-1', new Date(FROM), new Date(TO));

    expect(result.total).toBe(0);
    expect(result.points).toEqual([]);
  });

  it('lança 404 para serviço inexistente', async () => {
    findById.mockResolvedValue(null);

    await expect(service.getHistory('nope', new Date(FROM), new Date(TO))).rejects.toBeInstanceOf(NotFoundException);
    expect(findHistory).not.toHaveBeenCalled();
  });

  it('lança 404 para serviço removido', async () => {
    findById.mockResolvedValue({ ...existing, status: 'removed' });

    await expect(service.getHistory('svc-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lança 400 para from > to', async () => {
    await expect(service.getHistory('svc-1', new Date(TO), new Date(FROM))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(findById).not.toHaveBeenCalled();
  });
});

describe('ServiceHistoryController', () => {
  const getHistory = jest.fn<ServiceHistoryService['getHistory']>();
  const controller = new ServiceHistoryController({ getHistory } as unknown as ServiceHistoryService);

  beforeEach(() => {
    getHistory.mockReset();
  });

  it('converte query params e delega ao serviço', async () => {
    await controller.getHistory('svc-1', FROM, TO, '5');

    expect(getHistory).toHaveBeenCalledWith('svc-1', new Date(FROM), new Date(TO), 5);
  });

  it('retorna 400 para from/to/limit inválidos e from > to', async () => {
    await expect(controller.getHistory('svc-1', 'abc', TO)).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.getHistory('svc-1', FROM, 'abc')).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.getHistory('svc-1', FROM, TO, '0')).rejects.toBeInstanceOf(BadRequestException);
    expect(getHistory).not.toHaveBeenCalled();
  });

  it('propaga 400 de from > to vindo do serviço', async () => {
    getHistory.mockRejectedValue(new BadRequestException('"from" não pode ser posterior a "to".'));

    await expect(controller.getHistory('svc-1', TO, FROM)).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('SummaryController', () => {
  const getIndicators = jest.fn<EnvironmentIndicatorsService['getEnvironmentIndicators']>();
  const controller = new SummaryController({
    getEnvironmentIndicators: getIndicators,
  } as unknown as EnvironmentIndicatorsService);

  const indicators: EnvironmentIndicators = {
    period: { from: new Date(FROM), to: new Date(TO) },
    totalEnergyKwh: 2,
    totalCo2Emissions: 120,
    activeServices: 2,
    unavailableServices: 1,
    servicesWithoutMetrics: 3,
  };

  beforeEach(() => {
    getIndicators.mockReset();
  });

  it('retorna totais, contagens, período ISO e unidades', async () => {
    getIndicators.mockResolvedValue(indicators);

    const result = await controller.getSummary(FROM, TO);

    expect(getIndicators).toHaveBeenCalledWith(new Date(FROM), new Date(TO));
    expect(result).toEqual({
      period: { from: FROM, to: TO },
      units: { energyKwh: 'kWh', co2Emissions: 'gCO2e' },
      totals: { energyKwh: 2, co2Emissions: 120 },
      services: { active: 2, unavailable: 1, withoutMetrics: 3 },
    });
  });

  it('sem from/to delega com undefined (padrão 24h resolvido no serviço)', async () => {
    getIndicators.mockResolvedValue(indicators);

    await controller.getSummary();

    expect(getIndicators).toHaveBeenCalledWith(undefined, undefined);
  });

  it('retorna 400 para from/to inválidos', async () => {
    await expect(controller.getSummary('xx', TO)).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.getSummary(FROM, '2026-02-30')).rejects.toBeInstanceOf(BadRequestException);
    expect(getIndicators).not.toHaveBeenCalled();
  });

  it('propaga 400 para from > to', async () => {
    getIndicators.mockRejectedValue(new BadRequestException('"from" não pode ser posterior a "to".'));

    await expect(controller.getSummary(TO, FROM)).rejects.toBeInstanceOf(BadRequestException);
  });
});

