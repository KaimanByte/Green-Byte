import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { AuditLogDto } from './dto/audit-log.dto';

@ApiTags('Auditoria')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'operator')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista as alterações administrativas mais recentes',
    description: 'Quem alterou configurações ou usuários, o que mudou e quando. Mais recentes primeiro.',
  })
  @ApiQuery({ name: 'limit', required: false, example: 50, description: 'Máximo de registros (até 200)' })
  @ApiOkResponse({ type: [AuditLogDto] })
  @ApiForbiddenResponse({ description: 'Papel sem acesso à auditoria.' })
  async findRecent(@Query('limit') limit?: string): Promise<AuditLogDto[]> {
    return this.auditService.findRecent(limit === undefined ? undefined : Number(limit));
  }
}
