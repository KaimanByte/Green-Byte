import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { regioes } from '../regioes/regioes.schema';

export const servicos = pgTable('servicos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 255 }).notNull(),
  codigoRegiao: varchar('codigo_regiao', { length: 50 }).references(() => regioes.codigoRegiao).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('ativo'),
});