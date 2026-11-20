import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, lte, SQL } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { auditLogs, AuditAction, AuditLog, AuditTargetType, NewAuditLog } from './audit.schema';

export interface AuditLogFilter {
  action?: AuditAction;
  actorId?: number;
  targetType?: AuditTargetType;
  targetId?: string;
  from?: Date;
  to?: Date;
  limit: number;
  offset: number;
}

@Injectable()
export class AuditRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async create(data: NewAuditLog): Promise<AuditLog> {
    const result = await this.dbService.db.insert(auditLogs).values(data).returning();
    return result[0];
  }

  async findAll(filter: AuditLogFilter): Promise<AuditLog[]> {
    const conditions: SQL[] = [];

    if (filter.action !== undefined) {
      conditions.push(eq(auditLogs.action, filter.action));
    }
    if (filter.actorId !== undefined) {
      conditions.push(eq(auditLogs.actorId, filter.actorId));
    }
    if (filter.targetType !== undefined) {
      conditions.push(eq(auditLogs.targetType, filter.targetType));
    }
    if (filter.targetId !== undefined) {
      conditions.push(eq(auditLogs.targetId, filter.targetId));
    }
    if (filter.from !== undefined) {
      conditions.push(gte(auditLogs.createdAt, filter.from));
    }
    if (filter.to !== undefined) {
      conditions.push(lte(auditLogs.createdAt, filter.to));
    }

    return this.dbService.db
      .select()
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(filter.limit)
      .offset(filter.offset);
  }
}
