import { pgTable, varchar, numeric } from 'drizzle-orm/pg-core';

export const regioes = pgTable('regioes', {
  codigoRegiao: varchar('codigo_regiao', { length: 50 }).primaryKey(),
  pais: varchar('pais', { length: 100 }).notNull(),
  nomeRegiao: varchar('nome_regiao', { length: 100 }).notNull(),
  cidade: varchar('cidade', { length: 100 }),
  latitude: numeric('latitude').notNull(),
  longitude: numeric('longitude').notNull(),
  intensidadeCarbono: numeric('intensidade_carbono').notNull(),
  participacaoRenovavel: numeric('participacao_renovavel').notNull(),
});