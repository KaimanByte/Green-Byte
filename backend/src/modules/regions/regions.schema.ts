import { pgTable, varchar, doublePrecision } from 'drizzle-orm/pg-core';

export const regions = pgTable('regions', {
  regionCode: varchar('region_code', { length: 50 }).primaryKey(),
  country: varchar('country', { length: 100 }).notNull(),
  regionName: varchar('region_name', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  carbonIntensity: doublePrecision('carbon_intensity').notNull(),
  renewableSharePercent: doublePrecision('renewable_share_percent').notNull(),
});

export type Region = typeof regions.$inferSelect;
export type NewRegion = typeof regions.$inferInsert;