import { index, integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const AUDIT_ACTIONS = [
  'USER_CREATED',
  'USER_UPDATED',
  'USER_STATUS_CHANGED',
  'USER_DELETED',
  'MONITORING_CONFIG_UPDATED',
  'ENERGY_MODEL_UPDATED',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_TARGET_TYPES = ['user', 'monitoring_config', 'energy_model'] as const;

export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number];

/** Registro de auditoria das operações administrativas (AU-07). */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    actorId: integer('actor_id').notNull(),
    actorEmail: varchar('actor_email', { length: 255 }).notNull(),
    actorRole: varchar('actor_role', { length: 50 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    targetType: varchar('target_type', { length: 100 }).notNull(),
    targetId: varchar('target_id', { length: 100 }).notNull(),
    beforeValues: jsonb('before_values').$type<Record<string, unknown> | null>(),
    afterValues: jsonb('after_values').$type<Record<string, unknown> | null>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('audit_logs_created_at_idx').on(table.createdAt)],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
