import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Authorize } from '../auth/decorators/authorize.decorator';
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from './audit.schema';
import { AuditService } from './audit.service';
import { AuditLogResponseDto } from './dto/audit-log.dto';

/** Consulta de logs de auditoria: restrita a administradores (AU-07). */
@ApiTags('Auditoria')
@Authorize('admin')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista registros de auditoria das operações administrativas',
    description: 'Ordenado do mais recente para o mais antigo, com filtros opcionais e paginação.',
  })
  @ApiQuery({ name: 'action', required: false, enum: AUDIT_ACTIONS })
  @ApiQuery({ name: 'actorId', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'targetType', required: false, enum: AUDIT_TARGET_TYPES })
  @ApiQuery({ name: 'targetId', required: false, type: String, example: '42' })
  @ApiQuery({ name: 'from', required: false, example: '2026-11-01T00:00:00Z' })
  @ApiQuery({ name: 'to', required: false, example: '2026-11-30T23:59:59Z' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiOkResponse({ type: [AuditLogResponseDto] })
  @ApiBadRequestResponse({ description: 'Filtros ou período inválidos.' })
  findAll(
    @Query('action') action?: string,
    @Query('actorId') actorId?: string,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<AuditLogResponseDto[]> {
    return this.auditService.findAll({
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
}
