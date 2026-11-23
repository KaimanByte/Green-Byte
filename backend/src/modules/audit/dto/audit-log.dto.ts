import { ApiProperty } from '@nestjs/swagger';

export class AuditChangeDto {
  @ApiProperty({ example: 'collectionIntervalSeconds' })
  field!: string;

  @ApiProperty({ example: 30, nullable: true })
  from!: string | number | boolean | null;

  @ApiProperty({ example: 60, nullable: true })
  to!: string | number | boolean | null;
}

export class AuditLogDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 1, nullable: true, description: 'ID de quem fez a ação' })
  actorId!: number | null;

  @ApiProperty({ example: 'admin@greenbyte.com' })
  actorEmail!: string;

  @ApiProperty({ example: 'settings.update' })
  action!: string;

  @ApiProperty({ example: 'dev@empresa.com', nullable: true, description: 'Alvo da ação, quando houver' })
  target!: string | null;

  @ApiProperty({ type: [AuditChangeDto] })
  changes!: AuditChangeDto[];

  @ApiProperty({ example: '2026-11-16T18:00:00.000Z' })
  createdAt!: Date;
}
