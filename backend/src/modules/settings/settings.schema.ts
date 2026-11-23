import { pgTable, serial, integer, doublePrecision, timestamp } from 'drizzle-orm/pg-core';

/**
 * Configuração única do monitoramento (uma linha só, id = 1).
 * Os padrões dos parâmetros de potência são os do modelo do desafio (docs/calculos.md).
 */
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  collectionIntervalSeconds: integer('collection_interval_seconds').notNull().default(30),
  cpuMaxWatts: doublePrecision('cpu_max_watts').notNull().default(100),
  ramWattsPerGb: doublePrecision('ram_watts_per_gb').notNull().default(0.375),
  diskWattsPerGb: doublePrecision('disk_watts_per_gb').notNull().default(0.01),
  networkWattsPerGb: doublePrecision('network_watts_per_gb').notNull().default(0.02),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;

export type UpdateSettings = Partial<Omit<NewSettings, 'id' | 'updatedAt'>>;
