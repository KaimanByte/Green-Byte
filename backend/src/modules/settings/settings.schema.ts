import { pgTable, serial, integer, doublePrecision, timestamp } from 'drizzle-orm/pg-core';

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  collectionIntervalSeconds: integer('collection_interval_seconds').notNull().default(300),
  cpuMaxWatts: doublePrecision('cpu_max_watts').notNull().default(150.0),
  ramWattsPerGb: doublePrecision('ram_watts_per_gb').notNull().default(3.0),
  diskWattsPerGb: doublePrecision('disk_watts_per_gb').notNull().default(1.0),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;

export type UpdateSettings = Partial<Omit<NewSettings, 'id' | 'updatedAt'>>;