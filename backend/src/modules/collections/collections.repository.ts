import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, inArray, lte, sql, SQL } from 'drizzle-orm';
import { CollectionHistoryQuery } from './collection-history.query';
import { DatabaseService } from '../../database/database.service';
import { regions } from '../regions/regions.schema';
import { services } from '../services/services.schema';
import { collections, Collection, NewCollection } from './collections.schema';
import { ServicePeriodTotals } from './environment-indicators.types';

export type RegionEmissions = {
  regionCode: string;
  totalEnergyKwh: number;
  totalCo2Emissions: number;
};

export type ServiceEmissions = {
  serviceId: string;
  totalEnergyKwh: number;
  totalCo2Emissions: number;
};

/** Linha da série temporal: médias das coletas de um intervalo. */
export type TimeSeriesRow = {
  bucket: Date;
  collectionsCount: number;
  servicesCount: number;
  cpuPercent: number;
  memoryGb: number;
  diskGb: number;
  energyKwh: number;
  co2Emissions: number;
};

/** Linha da série temporal de UM serviço (comparação histórica). */
export type ServiceTimeSeriesRow = TimeSeriesRow & { serviceId: string };

@Injectable()
export class CollectionsRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async insertMany(data: NewCollection[]): Promise<Collection[]> {
    if (data.length === 0) {
      return [];
    }

    return this.dbService.db.insert(collections).values(data).returning();
  }

  async findById(id: number): Promise<Collection | null> {
    const result = await this.dbService.db
      .select()
      .from(collections)
      .where(eq(collections.id, id));

    return result[0] || null;
  }

  async findByServiceId(serviceId: string, limit = 100): Promise<Collection[]> {
    return this.dbService.db
      .select()
      .from(collections)
      .where(eq(collections.serviceId, serviceId))
      .orderBy(desc(collections.timestamp))
      .limit(limit);
  }

  /**
   * Histórico de um serviço, com intervalo [from, to] inclusivo e opcional.
   * Resultado sempre em ordem cronológica crescente.
   */
  async findHistory(query: CollectionHistoryQuery): Promise<Collection[]> {
    const conditions: SQL[] = [eq(collections.serviceId, query.serviceId)];

    if (query.from) {
      conditions.push(gte(collections.timestamp, query.from));
    }
    if (query.to) {
      conditions.push(lte(collections.timestamp, query.to));
    }

    const base = this.dbService.db
      .select()
      .from(collections)
      .where(and(...conditions));

    if (query.limit === undefined) {
      return base.orderBy(asc(collections.timestamp), asc(collections.id));
    }

    const latest = await base
      .orderBy(desc(collections.timestamp), desc(collections.id))
      .limit(query.limit);

    return latest.reverse();
  }

  async findByDateRange(
    start: Date,
    end: Date,
    serviceId?: string,
  ): Promise<Collection[]> {
    const conditions = [
      gte(collections.timestamp, start),
      lte(collections.timestamp, end),
    ];

    if (serviceId) {
      conditions.push(eq(collections.serviceId, serviceId));
    }

    return this.dbService.db
      .select()
      .from(collections)
      .where(and(...conditions))
      .orderBy(asc(collections.timestamp));
  }

  /**
   * Quantidade de coletas e somas de energia/CO2e por serviço no período [start, end] (inclusivo).
   * Serviços sem coletas no período não aparecem no resultado.
   */
  /**
   * Série temporal das coletas: agrupa as coletas de [from, to] em intervalos de
   * `bucketSeconds` (alinhados a `from`, via date_bin) e devolve a MÉDIA de cada métrica.
   * Intervalos sem coleta não aparecem. Ordem cronológica crescente.
   */
  async getTimeSeries(
    from: Date,
    to: Date,
    bucketSeconds: number,
    serviceId?: string,
  ): Promise<TimeSeriesRow[]> {
    const conditions: SQL[] = [gte(collections.timestamp, from), lte(collections.timestamp, to)];
    if (serviceId) {
      conditions.push(eq(collections.serviceId, serviceId));
    }

    const bucket = sql<Date>`date_bin(make_interval(secs => ${bucketSeconds}), ${collections.timestamp}, ${from.toISOString()}::timestamptz)`;

    return this.dbService.db
      .select({
        bucket: bucket.mapWith((value: string | Date) => new Date(value)),
        collectionsCount: sql<number>`count(*)`.mapWith(Number),
        servicesCount: sql<number>`count(distinct ${collections.serviceId})`.mapWith(Number),
        cpuPercent: sql<number>`avg(${collections.cpuPercent})`.mapWith(Number),
        memoryGb: sql<number>`avg(${collections.memoryGb})`.mapWith(Number),
        diskGb: sql<number>`avg(${collections.diskGb})`.mapWith(Number),
        energyKwh: sql<number>`avg(${collections.energyKwh})`.mapWith(Number),
        co2Emissions: sql<number>`avg(${collections.co2Emissions})`.mapWith(Number),
      })
      .from(collections)
      .where(and(...conditions))
      // por posição: repetir a expressão geraria novos parâmetros ($n) e o Postgres
      // não a reconheceria como a mesma do SELECT
      .groupBy(sql`1`)
      .orderBy(sql`1`);
  }

  /**
   * Séries temporais separadas por serviço: mesma agregação de `getTimeSeries`
   * (média por intervalo, intervalos alinhados em `from`), mas agrupando também por serviço,
   * para que nenhum ponto misture coletas de serviços diferentes.
   */
  async getTimeSeriesByService(
    from: Date,
    to: Date,
    bucketSeconds: number,
    serviceIds: string[],
  ): Promise<ServiceTimeSeriesRow[]> {
    if (serviceIds.length === 0) {
      return [];
    }

    const bucket = sql<Date>`date_bin(make_interval(secs => ${bucketSeconds}), ${collections.timestamp}, ${from.toISOString()}::timestamptz)`;

    return this.dbService.db
      .select({
        serviceId: collections.serviceId,
        bucket: bucket.mapWith((value: string | Date) => new Date(value)),
        collectionsCount: sql<number>`count(*)`.mapWith(Number),
        servicesCount: sql<number>`count(distinct ${collections.serviceId})`.mapWith(Number),
        cpuPercent: sql<number>`avg(${collections.cpuPercent})`.mapWith(Number),
        memoryGb: sql<number>`avg(${collections.memoryGb})`.mapWith(Number),
        diskGb: sql<number>`avg(${collections.diskGb})`.mapWith(Number),
        energyKwh: sql<number>`avg(${collections.energyKwh})`.mapWith(Number),
        co2Emissions: sql<number>`avg(${collections.co2Emissions})`.mapWith(Number),
      })
      .from(collections)
      .where(
        and(
          gte(collections.timestamp, from),
          lte(collections.timestamp, to),
          inArray(collections.serviceId, serviceIds),
        ),
      )
      // por posição (ver getTimeSeries): 1 = serviço, 2 = intervalo
      .groupBy(sql`1, 2`)
      .orderBy(sql`1, 2`);
  }

  async getServicePeriodTotals(start: Date, end: Date): Promise<ServicePeriodTotals[]> {
    return this.dbService.db
      .select({
        serviceId: collections.serviceId,
        collectionsCount: sql<number>`count(*)`.mapWith(Number),
        totalEnergyKwh: sql<number>`coalesce(sum(${collections.energyKwh}), 0)`.mapWith(Number),
        totalCo2Emissions: sql<number>`coalesce(sum(${collections.co2Emissions}), 0)`.mapWith(Number),
      })
      .from(collections)
      .where(and(gte(collections.timestamp, start), lte(collections.timestamp, end)))
      .groupBy(collections.serviceId);
  }

  async getEmissionsByRegion(start: Date, end: Date): Promise<RegionEmissions[]> {
    return this.dbService.db
      .select({
        // Busca do schema regions (que está em inglês conforme o erro TS2339)
        regionCode: regions.regionCode,
        
        // ATENÇÃO: Verifique se as crases (`) estão envolvendo a função coalesce no seu editor!
        totalEnergyKwh: sql<number>`coalesce(sum(${collections.energyKwh}), 0)`.mapWith(Number),
        totalCo2Emissions: sql<number>`coalesce(sum(${collections.co2Emissions}), 0)`.mapWith(Number),
      })
      .from(collections)
      .innerJoin(services, eq(collections.serviceId, services.id))
      // Une a coluna regionCode (do services) com regionCode (do regions)
      .innerJoin(regions, eq(services.regionCode, regions.regionCode))
      .where(
        and(gte(collections.timestamp, start), lte(collections.timestamp, end)),
      )
      .groupBy(regions.regionCode);
  }

  async getEmissionsByService(start: Date, end: Date): Promise<ServiceEmissions[]> {
    const totalCo2Emissions = sql<number>`coalesce(sum(${collections.co2Emissions}), 0)`;

    return this.dbService.db
      .select({
        serviceId: collections.serviceId,
        
        // ATENÇÃO: Verifique se as crases (`) estão envolvendo a função coalesce no seu editor!
        totalEnergyKwh: sql<number>`coalesce(sum(${collections.energyKwh}), 0)`.mapWith(Number),
        totalCo2Emissions: totalCo2Emissions.mapWith(Number),
      })
      .from(collections)
      .where(
        and(gte(collections.timestamp, start), lte(collections.timestamp, end)),
      )
      .groupBy(collections.serviceId)
      .orderBy(asc(totalCo2Emissions));
  }
}
