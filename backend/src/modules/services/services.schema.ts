import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { regions } from '../regions/regions.schema';

export const services = pgTable('services', {
  id: varchar('id', { length: 100 }).primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  codigoRegiao: varchar('codigo_regiao', { length: 50 }).references(() => regions.regionCode).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('ativo'),
});

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;