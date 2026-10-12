
import { pgTable, serial, text, timestamp, boolean, doublePrecision, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const zones = pgTable('zones', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
});

export const devices = pgTable('devices', {
    id: serial('id').primaryKey(),
    zoneId: integer('zone_id').references(() => zones.id).notNull(),
    type: text('type').notNull(),
    status: boolean('status').default(true).notNull(),
});

export const metrics = pgTable('metrics', {
    id: serial('id').primaryKey(),
    deviceId: integer('device_id').references(() => devices.id).notNull(),
    value: doublePrecision('value').notNull(),
    unit: text('unit').notNull(),
    recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});