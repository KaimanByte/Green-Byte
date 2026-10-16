import { pgTable, serial, varchar, timestamp, doublePrecision } from 'drizzle-orm/pg-core';
import { services } from '../services/services.schema';

export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  serviceId: varchar('service_id', { length: 100 }).references(() => services.id).notNull(),
  
  // Apenas a adição do timezone para alinhar com o repositório
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  
  cpuPercent: doublePrecision('cpu_percent').notNull(),
  memoryGb: doublePrecision('memory_gb').notNull(),
  diskGb: doublePrecision('disk_gb').notNull(),
  energyKwh: doublePrecision('energy_kwh').notNull(),
  co2Emissions: doublePrecision('co2_emissions').notNull(),
});

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;