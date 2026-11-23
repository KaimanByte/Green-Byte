import { index, integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

/** Uma alteração de campo registrada na auditoria. */
export type AuditChange = { field: string; from: string | number | boolean | null; to: string | number | boolean | null };

/**
 * Trilha de auditoria da área administrativa: quem mudou o quê e quando.
 * `actorId` não é chave estrangeira de propósito: o registro sobrevive à exclusão do usuário
 * (o e-mail fica copiado em `actorEmail`).
 */
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorId: integer('actor_id'),
  actorEmail: varchar('actor_email', { length: 255 }).notNull(),
  /** ex.: settings.update, user.create */
  action: varchar('action', { length: 50 }).notNull(),
  /** alvo legível da ação (ex.: e-mail do usuário alterado) */
  target: varchar('target', { length: 255 }),
  changes: jsonb('changes').$type<AuditChange[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('audit_logs_created_at_idx').on(table.createdAt)]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
