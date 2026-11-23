import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { StartupSyncService } from '../../startup-sync.service';

class HealthCollectionDto {
  @ApiProperty({ example: 30, description: 'Intervalo de coleta em vigor (s)' }) intervalSeconds!: number;
  @ApiProperty({ example: false, description: 'Há um ciclo de coleta em andamento agora' }) isRunning!: boolean;
  @ApiProperty({
    example: true,
    nullable: true,
    description: 'Se o último ciclo terminou sem erro; null antes do primeiro ciclo',
  })
  lastCycleSucceeded!: boolean | null;
  @ApiProperty({ example: '2026-11-22T18:00:01.200Z', nullable: true, description: 'Fim do último ciclo' })
  lastCycleAt!: Date | null;
}

class HealthDto {
  @ApiProperty({ example: 'ok', enum: ['ok'] }) status!: 'ok';
  @ApiProperty({ example: 3600, description: 'Tempo desde que o processo subiu (s)' }) uptimeSeconds!: number;
  @ApiProperty({ type: HealthCollectionDto }) collection!: HealthCollectionDto;
}

/**
 * Verificação de vida do backend, pública e sem consulta ao banco: responde rápido mesmo se o
 * banco estiver lento. Serve de Health Check do Render e de alvo para um ping externo
 * (UptimeRobot, cron-job.org) que mantém a instância acordada e a coleta rodando.
 *
 * Sempre responde 200 enquanto o processo está de pé: uma falha da coleta aparece em
 * `collection.lastCycleSucceeded`, sem fazer a plataforma reiniciar o serviço.
 * Detalhes da falha (etapa, mensagem) continuam só em GET /monitoring/collection-status.
 */
@ApiTags('Monitoramento')
@Controller('health')
export class HealthController {
  constructor(private readonly startupSyncService: StartupSyncService) {}

  @Get()
  @ApiOperation({
    summary: 'Saúde do backend',
    description: 'Rota pública para health check e ping de manutenção; não expõe detalhes administrativos.',
  })
  @ApiOkResponse({ type: HealthDto })
  getHealth(): HealthDto {
    const { intervalSeconds, isRunning, lastCycle } = this.startupSyncService.getStatus();
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      collection: {
        intervalSeconds,
        isRunning,
        lastCycleSucceeded: lastCycle ? lastCycle.succeeded : null,
        lastCycleAt: lastCycle ? lastCycle.finishedAt : null,
      },
    };
  }
}
