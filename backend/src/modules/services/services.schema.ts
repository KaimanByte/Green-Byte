import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { regions } from '../regions/regions.schema';

/** Resultado da tentativa de coleta mais recente de um serviço. */
export type CollectionState = 'active' | 'no_metrics' | 'unavailable';

export const services = pgTable('services', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  regionCode: varchar('region_code', { length: 50 })
    .references(() => regions.regionCode)
    .notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  /** como foi a última tentativa de coleta: coletado, sem métricas válidas ou fonte indisponível */
  lastCollectionState: varchar('last_collection_state', { length: 20 }).$type<CollectionState>(),
  lastCollectionAttemptAt: timestamp('last_collection_attempt_at', { withTimezone: true }),
  /** motivo da última falha, para a administração; null quando a coleta deu certo */
  lastCollectionError: varchar('last_collection_error', { length: 500 }),
});

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;