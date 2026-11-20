import { boolean, pgEnum, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { USER_ROLES } from './user-role';

/** Restringe o papel no próprio banco: só `admin` ou `operator`. */
export const userRoleEnum = pgEnum('user_role', USER_ROLES);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  hashPassword: varchar('hash_password', { length: 255 }).notNull(),
  // menor privilégio por padrão: contas novas (e as já existentes na migração) entram como operator
  role: userRoleEnum('role').notNull().default('operator'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
/** Usuário como pode sair em respostas HTTP: nunca inclui o hash da senha. */
export type PublicUser = Omit<User, 'hashPassword'>;

export function toPublicUser(user: User): PublicUser {
  const { hashPassword: _hashPassword, ...publicUser } = user;
  return publicUser;
}
