import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  senhaHash: varchar('senha_hash', { length: 255 }).notNull(),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
});