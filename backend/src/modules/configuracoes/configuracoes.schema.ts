import { pgTable, uuid, integer, numeric } from 'drizzle-orm/pg-core';

export const configuracoes = pgTable('configuracoes', {
  id: uuid('id').primaryKey().defaultRandom(),
  intervaloColetaSegundos: integer('intervalo_coleta_segundos').notNull().default(300),
  constanteWattsCpu: numeric('constante_watts_cpu').notNull(),
  constanteWattsMemoria: numeric('constante_watts_memoria').notNull(),
  constanteWattsDisco: numeric('constante_watts_disco').notNull(),
  constanteWattsRede: numeric('constante_watts_rede').notNull(),
});