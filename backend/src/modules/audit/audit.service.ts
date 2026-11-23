import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import { AuditChange, AuditLog } from './audit.schema';

export type AuditAction =
  | 'settings.update'
  | 'user.create'
  | 'user.update'
  | 'user.delete';

export interface AuditActor {
  id: number;
  email: string;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/** Compara dois objetos nos campos pedidos e devolve só o que mudou. */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: T,
  fields: readonly (keyof T & string)[],
): AuditChange[] {
  const changes: AuditChange[] = [];
  for (const field of fields) {
    if (before[field] !== after[field]) {
      changes.push({ field, from: before[field] as AuditChange['from'], to: after[field] as AuditChange['to'] });
    }
  }
  return changes;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepository: AuditRepository) {}

  /**
   * Grava um registro. A falha da auditoria não desfaz a ação já concluída:
   * ela vai para o log do servidor, para não esconder o problema.
   */
  async record(actor: AuditActor, action: AuditAction, target: string | null, changes: AuditChange[] = []): Promise<void> {
    try {
      await this.auditRepository.insert({ actorId: actor.id, actorEmail: actor.email, action, target, changes });
    } catch (error) {
      this.logger.error(
        `Falha ao gravar auditoria (${action} por ${actor.email}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async findRecent(limit?: number): Promise<AuditLog[]> {
    const safeLimit = Number.isInteger(limit) && limit! > 0 ? Math.min(limit!, MAX_LIMIT) : DEFAULT_LIMIT;
    return this.auditRepository.findRecent(safeLimit);
  }
}
