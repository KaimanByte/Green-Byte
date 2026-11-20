import { BadRequestException, Injectable } from '@nestjs/common';
import { parseDateParam } from '../collections/period';
import { AuditRepository } from './audit.repository';
import { AuditSanitizer } from './audit.sanitizer';
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
  AuditAction,
  AuditLog,
  AuditTargetType,
} from './audit.schema';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

export interface AuditActor {
  id: number;
  email: string;
  role: string;
}

export interface RecordAuditInput {
  actor: AuditActor;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string | number;
  beforeValues?: unknown;
  afterValues?: unknown;
}

export interface AuditLogQueryInput {
  action?: string;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  from?: string;
  to?: string;
  limit?: string;
  offset?: string;
}

@Injectable()
export class AuditService {
  constructor(
    private readonly auditRepository: AuditRepository,
    private readonly sanitizer: AuditSanitizer = new AuditSanitizer(),
  ) {}

  async record(input: RecordAuditInput): Promise<AuditLog> {
    return this.auditRepository.create({
      actorId: input.actor.id,
      actorEmail: input.actor.email,
      actorRole: input.actor.role,
      action: input.action,
      targetType: input.targetType,
      targetId: String(input.targetId),
      beforeValues: this.sanitizer.sanitize(input.beforeValues),
      afterValues: this.sanitizer.sanitize(input.afterValues),
    });
  }

  recordUserCreated(actor: AuditActor, userId: number, afterValues: unknown): Promise<AuditLog> {
    return this.record({
      actor,
      action: 'USER_CREATED',
      targetType: 'user',
      targetId: userId,
      beforeValues: null,
      afterValues,
    });
  }

  recordUserUpdated(
    actor: AuditActor,
    userId: number,
    beforeValues: unknown,
    afterValues: unknown,
  ): Promise<AuditLog> {
    return this.record({
      actor,
      action: 'USER_UPDATED',
      targetType: 'user',
      targetId: userId,
      beforeValues,
      afterValues,
    });
  }

  recordUserStatusChanged(
    actor: AuditActor,
    userId: number,
    beforeValues: unknown,
    afterValues: unknown,
  ): Promise<AuditLog> {
    return this.record({
      actor,
      action: 'USER_STATUS_CHANGED',
      targetType: 'user',
      targetId: userId,
      beforeValues,
      afterValues,
    });
  }

  recordUserDeleted(actor: AuditActor, userId: number, beforeValues: unknown): Promise<AuditLog> {
    return this.record({
      actor,
      action: 'USER_DELETED',
      targetType: 'user',
      targetId: userId,
      beforeValues,
      afterValues: null,
    });
  }

  recordMonitoringConfigUpdated(
    actor: AuditActor,
    targetId: string | number,
    beforeValues: unknown,
    afterValues: unknown,
  ): Promise<AuditLog> {
    return this.record({
      actor,
      action: 'MONITORING_CONFIG_UPDATED',
      targetType: 'monitoring_config',
      targetId,
      beforeValues,
      afterValues,
    });
  }

  recordEnergyModelUpdated(
    actor: AuditActor,
    targetId: string | number,
    beforeValues: unknown,
    afterValues: unknown,
  ): Promise<AuditLog> {
    return this.record({
      actor,
      action: 'ENERGY_MODEL_UPDATED',
      targetType: 'energy_model',
      targetId,
      beforeValues,
      afterValues,
    });
  }

  async findAll(query: AuditLogQueryInput = {}): Promise<AuditLog[]> {
    const action = this.parseAction(query.action);
    const targetType = this.parseTargetType(query.targetType);
    const actorId = this.parseOptionalInt('actorId', query.actorId, 1);
    const from = parseDateParam('from', query.from);
    const to = parseDateParam('to', query.to);

    if (from && to && from.getTime() > to.getTime()) {
      throw new BadRequestException('"from" não pode ser posterior a "to".');
    }

    const limit = this.parseOptionalInt('limit', query.limit, 1, MAX_LIMIT) ?? DEFAULT_LIMIT;
    const offset = this.parseOptionalInt('offset', query.offset, 0) ?? 0;
    const targetId = query.targetId?.trim() || undefined;

    return this.auditRepository.findAll({
      action,
      actorId,
      targetType,
      targetId,
      from,
      to,
      limit,
      offset,
    });
  }

  private parseAction(value?: string): AuditAction | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }
    if ((AUDIT_ACTIONS as readonly string[]).includes(value)) {
      return value as AuditAction;
    }
    throw new BadRequestException(`Parâmetro "action" inválido. Valores permitidos: ${AUDIT_ACTIONS.join(', ')}.`);
  }

  private parseTargetType(value?: string): AuditTargetType | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }
    if ((AUDIT_TARGET_TYPES as readonly string[]).includes(value)) {
      return value as AuditTargetType;
    }
    throw new BadRequestException(
      `Parâmetro "targetType" inválido. Valores permitidos: ${AUDIT_TARGET_TYPES.join(', ')}.`,
    );
  }

  private parseOptionalInt(name: string, value: string | undefined, min: number, max?: number): number | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(`Parâmetro "${name}" deve ser um número inteiro.`);
    }
    const parsed = Number(value);
    if (parsed < min || (max !== undefined && parsed > max)) {
      const bounds = max !== undefined ? `entre ${min} e ${max}` : `maior ou igual a ${min}`;
      throw new BadRequestException(`Parâmetro "${name}" deve estar ${bounds}.`);
    }
    return parsed;
  }
}
