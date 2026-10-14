import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { regions, Region, NewRegion } from './regions.schema';

@Injectable()
export class RegionsRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll(): Promise<Region[]> {
    return this.dbService.db.select().from(regions);
  }

  async findByCode(regionCode: string): Promise<Region | null> {
    const result = await this.dbService.db
      .select()
      .from(regions)
      .where(eq(regions.regionCode, regionCode));
    
    return result[0] || null;
  }

  async upsert(data: NewRegion): Promise<Region> {
    // esse método insere no banco se não existir, atualiza se já existir, sendo uma junção de insert e update, usando o regionCode como chave primária
    const result = await this.dbService.db
      .insert(regions)
      .values(data)
      .onConflictDoUpdate({
        target: regions.regionCode,
        set: {
          country: data.country,
          regionName: data.regionName,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          carbonIntensity: data.carbonIntensity,
          renewableSharePercent: data.renewableSharePercent,
        }
      })
      .returning();
      
    return result[0];
  }

  async delete(regionCode: string): Promise<Region | null> {
    const result = await this.dbService.db
      .delete(regions)
      .where(eq(regions.regionCode, regionCode))
      .returning();
      
    return result[0] || null;
  }
}