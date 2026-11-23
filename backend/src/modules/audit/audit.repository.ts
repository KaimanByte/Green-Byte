import { Injectable } from '@nestjs/common';
import { desc } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { auditLogs, AuditLog, NewAuditLog } from './audit.schema';

@Injectable()
export class AuditRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async insert(entry: NewAuditLog): Promise<AuditLog> {
    const result = await this.dbService.db.insert(auditLogs).values(entry).returning();
    return result[0];
  }

  /** Registros mais recentes primeiro. */
  async findRecent(limit: number): Promise<AuditLog[]> {
    return this.dbService.db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt), desc(auditLogs.id)).limit(limit);
  }
}
