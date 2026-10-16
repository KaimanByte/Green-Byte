import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { regions } from '../regions/regions.schema';

export const services = pgTable('services', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  regionCode: varchar('region_code', { length: 50 })
    .references(() => regions.regionCode)
    .notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
});

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;