import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database.provider';
import * as schema from '../schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

@Injectable()
export class DatabaseRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // --- Dispositivos e Serviços ---

  async getDevices() {
    return await this.db.select().from(schema.devices);
  }

  async createDevice(data: typeof schema.devices.$inferInsert) {
    return await this.db.insert(schema.devices).values(data).returning();
  }

  // --- Coletas e Métricas ---

  async insertMetric(data: typeof schema.metrics.$inferInsert) {
    return await this.db.insert(schema.metrics).values(data).returning();
  }

  async getMetricsByDevice(deviceId: any) {
    return await this.db
      .select()
      .from(schema.metrics)
      .where(eq(schema.metrics.deviceId, deviceId));
  }
}