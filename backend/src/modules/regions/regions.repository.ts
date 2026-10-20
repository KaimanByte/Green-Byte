import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
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

  async upsertMany(data: NewRegion[]): Promise<Region[]> {
    if (!data || data.length === 0) {
      return [];
    }

    return await this.dbService.db
      .insert(regions)
      .values(data)
      .onConflictDoUpdate({
        target: regions.regionCode,
        set: {
          country: sql`EXCLUDED.country`,
          regionName: sql`EXCLUDED.region_name`, 
          city: sql`EXCLUDED.city`,
          latitude: sql`EXCLUDED.latitude`,
          longitude: sql`EXCLUDED.longitude`,
          carbonIntensity: sql`EXCLUDED.carbon_intensity`,
          renewableSharePercent: sql`EXCLUDED.renewable_share_percent`,
        }
      })
      .returning();
  }

  async delete(regionCode: string): Promise<Region | null> {
    const result = await this.dbService.db
      .delete(regions)
      .where(eq(regions.regionCode, regionCode))
      .returning();
      
    return result[0] || null;
  }
}