import { pgTable, uuid, timestamp, numeric, integer } from 'drizzle-orm/pg-core';
import { servicos } from '../servicos/servicos.schema';

export const coletasHistorico = pgTable('coletas_historico', {
  id: uuid('id').primaryKey().defaultRandom(),
  servicoId: uuid('servico_id').references(() => servicos.id).notNull(),
  dataHora: timestamp('data_hora').defaultNow().notNull(),
  cpuPercentual: numeric('cpu_percentual').notNull(),
  memoriaGb: numeric('memoria_gb').notNull(),
  discoGb: numeric('disco_gb').notNull(),
  redeGb: numeric('rede_gb').notNull(),
  intervaloSegundos: integer('intervalo_segundos').notNull(),
  energiaKwh: numeric('energia_kwh').notNull(),
  emissaoCo2e: numeric('emissao_co2e').notNull(),
});