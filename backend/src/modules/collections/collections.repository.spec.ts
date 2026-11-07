import { jest } from '@jest/globals';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { CollectionsRepository } from './collections.repository';
import { Collection, collections } from './collections.schema';
import { DatabaseService } from '../../database/database.service';

function makeRow(id: number, iso: string): Collection {
  return {
    id,
    serviceId: 'svc-1',
    timestamp: new Date(iso),
    cpuPercent: 1,
    memoryGb: 1,
    diskGb: 1,
    energyKwh: 1,
    co2Emissions: 1,
  };
}

describe('collections schema (DB-04)', () => {
  it('persiste timestamp com fuso, obrigatório e com default now()', () => {
    const column = collections.timestamp;
    expect(column.notNull).toBe(true);
    expect(column.hasDefault).toBe(true);
    expect(column.getSQLType()).toBe('timestamp with time zone');
  });

  it('possui índice composto (service_id, timestamp)', () => {
    const { indexes } = getTableConfig(collections);
    const idx = indexes.find((i) => i.config.name === 'collections_service_id_timestamp_idx');

    expect(idx).toBeDefined();
    expect(idx?.config.columns.map((c) => (c as { name: string }).name)).toEqual([
      'service_id',
      'timestamp',
    ]);
  });
});

describe('CollectionsRepository.findHistory', () => {
  const orderBy = jest.fn<(...args: unknown[]) => unknown>();
  const limit = jest.fn<(n: number) => Promise<Collection[]>>();
  const where = jest.fn<(...args: unknown[]) => unknown>();
  let repository: CollectionsRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    where.mockReturnValue({ orderBy });
    const db = { select: () => ({ from: () => ({ where }) }) };
    repository = new CollectionsRepository({ db } as unknown as DatabaseService);
  });

  it('retorna em ordem cronológica quando não há limit', async () => {
    const rows = [makeRow(1, '2026-10-01T10:00:00Z'), makeRow(2, '2026-10-01T11:00:00Z')];
    orderBy.mockReturnValue(Promise.resolve(rows));

    const result = await repository.findHistory({
      serviceId: 'svc-1',
      from: new Date('2026-10-01T00:00:00Z'),
      to: new Date('2026-10-02T00:00:00Z'),
    });

    expect(where).toHaveBeenCalledTimes(1);
    expect(orderBy).toHaveBeenCalledTimes(1);
    expect(result).toEqual(rows);
  });

  it('aplica limit nas mais recentes e devolve em ordem cronológica', async () => {
    orderBy.mockReturnValue({ limit });
    limit.mockResolvedValue([makeRow(3, '2026-10-03T00:00:00Z'), makeRow(2, '2026-10-02T00:00:00Z')]);

    const result = await repository.findHistory({ serviceId: 'svc-1', limit: 2 });

    expect(limit).toHaveBeenCalledWith(2);
    expect(result.map((r) => r.id)).toEqual([2, 3]);
  });

  it('retorna lista vazia para período sem coletas', async () => {
    orderBy.mockReturnValue(Promise.resolve([]));

    const result = await repository.findHistory({
      serviceId: 'svc-1',
      from: new Date('2020-01-01T00:00:00Z'),
      to: new Date('2020-01-02T00:00:00Z'),
    });

    expect(result).toEqual([]);
  });
});
