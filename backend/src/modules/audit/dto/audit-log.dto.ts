import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../audit.schema';

export class AuditLogResponseDto {
  @ApiProperty({ example: 1, description: 'ID do registro de auditoria' })
  id!: number;

  @ApiProperty({ example: 1, description: 'ID do usuário que executou a ação' })
  actorId!: number;

  @ApiProperty({ example: 'admin@admin.com', description: 'E-mail do ator no momento da operação' })
  actorEmail!: string;

  @ApiProperty({ example: 'admin', description: 'Papel do ator no momento da operação' })
  actorRole!: string;

  @ApiProperty({ enum: AUDIT_ACTIONS, example: 'USER_CREATED', description: 'Ação administrativa executada' })
  action!: string;

  @ApiProperty({ enum: AUDIT_TARGET_TYPES, example: 'user', description: 'Tipo do recurso afetado' })
  targetType!: string;

  @ApiProperty({ example: '42', description: 'Identificador do recurso afetado' })
  targetId!: string;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    example: { id: 42, email: 'op@empresa.com', role: 'operator', isActive: true },
    description: 'Estado anterior sanitizado (nunca contém senhas, hashes ou tokens)',
  })
  beforeValues!: Record<string, unknown> | null;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    example: { id: 42, email: 'op@empresa.com', role: 'admin', isActive: true },
    description: 'Estado posterior sanitizado (nunca contém senhas, hashes ou tokens)',
  })
  afterValues!: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-11-20T20:00:00.000Z', description: 'Data e hora do registro' })
  createdAt!: Date;
}
