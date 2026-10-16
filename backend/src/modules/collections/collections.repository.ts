import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { regions } from '../regions/regions.schema';
import { services } from '../services/services.schema';
import { collections, Collection, NewCollection } from './collections.schema';

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
    return this.dbService.db
      .select({
        serviceId: collections.serviceId,
        
        // ATENÇÃO: Verifique se as crases (`) estão envolvendo a função coalesce no seu editor!
        totalEnergyKwh: sql<number>`coalesce(sum(${collections.energyKwh}), 0)`.mapWith(Number),
        totalCo2Emissions: sql<number>`coalesce(sum(${collections.co2Emissions}), 0)`.mapWith(Number),
      })
      .from(collections)
      .where(
        and(gte(collections.timestamp, start), lte(collections.timestamp, end)),
      )
      .groupBy(collections.serviceId);
  }
}