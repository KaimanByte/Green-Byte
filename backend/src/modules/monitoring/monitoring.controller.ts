import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { StartupSyncService } from '../../startup-sync.service';

class SyncCycleStatusDto {
  @ApiProperty({ example: 'periódico', enum: ['inicialização', 'periódico'] }) trigger!: string;
  @ApiProperty({ example: '2026-11-16T18:00:00.000Z' }) startedAt!: Date;
  @ApiProperty({ example: '2026-11-16T18:00:01.200Z' }) finishedAt!: Date;
  @ApiProperty({ example: 1200 }) durationMs!: number;
  @ApiProperty({ example: true }) succeeded!: boolean;
  @ApiProperty({ example: null, nullable: true, description: 'Etapa em que o ciclo falhou' }) failedStep!: string | null;
  @ApiProperty({ example: null, nullable: true }) errorMessage!: string | null;
  @ApiProperty({ example: 8, description: 'Coletas gravadas no ciclo' }) collectionsSaved!: number;
}

class CollectionStatusDto {
  @ApiProperty({ example: 30, description: 'Intervalo em vigor (s)' }) intervalSeconds!: number;
  @ApiProperty({ example: false, description: 'Há um ciclo em andamento agora' }) isRunning!: boolean;
  @ApiProperty({ example: '2026-11-16T18:00:30.000Z', nullable: true }) nextRunAt!: Date | null;
  @ApiProperty({ type: SyncCycleStatusDto, nullable: true }) lastCycle!: SyncCycleStatusDto | null;
}

/** Contrato público mínimo para que o dashboard acompanhe o ritmo da coleta. */
class CollectionIntervalDto {
  @ApiProperty({ example: 30, description: 'Intervalo de coleta em vigor (s)' }) intervalSeconds!: number;
}

@ApiTags('Monitoramento')
@Controller('monitoring')
export class PublicMonitoringController {
  constructor(private readonly startupSyncService: StartupSyncService) {}

  @Get('collection-interval')
  @ApiOperation({
    summary: 'Intervalo efetivo da coleta',
    description: 'Expõe somente o intervalo em vigor para o dashboard ajustar sua atualização automática.',
  })
  @ApiOkResponse({ type: CollectionIntervalDto })
  getCollectionInterval(): CollectionIntervalDto {
    return { intervalSeconds: this.startupSyncService.getStatus().intervalSeconds };
  }
}

@ApiTags('Monitoramento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'operator')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly startupSyncService: StartupSyncService) {}

  @Get('collection-status')
  @ApiOperation({
    summary: 'Saúde da coleta automática',
    description: 'Intervalo em vigor, próximo disparo e resultado do último ciclo (duração, falha, coletas gravadas).',
  })
  @ApiOkResponse({ type: CollectionStatusDto })
  getCollectionStatus(): CollectionStatusDto {
    return this.startupSyncService.getStatus();
  }
}
