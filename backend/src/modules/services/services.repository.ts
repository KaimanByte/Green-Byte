import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { services, Service, NewService } from './services.schema';

@Injectable()
export class ServicesRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll(): Promise<Service[]> {
    return this.dbService.db.select().from(services);
  }

  async findById(id: string): Promise<Service | null> {
    const result = await this.dbService.db
      .select()
      .from(services)
      .where(eq(services.id, id));

    return result[0] || null;
  }

  async upsertMany(data: NewService[]): Promise<Service[]> {
    if (data.length === 0) return [];

    return this.dbService.db
      .insert(services)
      .values(data)
      .onConflictDoUpdate({
        target: services.id,
        set: {
          name: sql`EXCLUDED.name`,
          regionCode: sql`EXCLUDED.region_code`,
          status: sql`EXCLUDED.status`,
        },
      })
      .returning();
  }
}