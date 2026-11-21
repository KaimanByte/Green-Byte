import { boolean, pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';
import type { Role } from '../auth/roles';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  hashPassword: varchar('hash_password', { length: 255 }).notNull(),
  /** papel de acesso (ver modules/auth/roles.ts) */
  role: varchar('role', { length: 20 }).$type<Role>().notNull().default('operator'),
  /** conta desativada não faz login nem usa token já emitido */
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
