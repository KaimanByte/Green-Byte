import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';
import type {
  CollectionCycleResultStatus,
  CollectionOperationalStatus,
  CollectionSyncTrigger,
} from '../../../startup-sync.service';
import { MAX_UPDATE_INTERVAL_SECONDS, MIN_COLLECTION_INTERVAL_SECONDS } from '../polling-interval';

export class UpdateCollectionIntervalDto {
  @ApiProperty({
    description: 'Novo intervalo de coleta automática em segundos (aplicado sem reiniciar o backend)',
    example: 60,
    minimum: MIN_COLLECTION_INTERVAL_SECONDS,
    maximum: MAX_UPDATE_INTERVAL_SECONDS,
  })
  @IsInt({ message: 'O intervalo de coleta deve ser um número inteiro em segundos.' })
  @Min(MIN_COLLECTION_INTERVAL_SECONDS, {
    message: `O intervalo de coleta deve ser de pelo menos ${MIN_COLLECTION_INTERVAL_SECONDS} segundo.`,
  })
  @Max(MAX_UPDATE_INTERVAL_SECONDS, {
    message: `O intervalo de coleta não pode exceder ${MAX_UPDATE_INTERVAL_SECONDS} segundos.`,
  })
  collectionIntervalSeconds!: number;
}

export class LastCycleHealthDto {
  @ApiProperty({ enum: ['inicialização', 'periódico'], example: 'periódico' })
  trigger!: CollectionSyncTrigger;

  @ApiProperty({ enum: ['success', 'failed', 'no_data'], example: 'success' })
  status!: CollectionCycleResultStatus;

  @ApiProperty({ example: '2026-11-20T20:00:00.000Z' })
  startedAt!: string;

  @ApiProperty({ example: '2026-11-20T20:00:00.420Z' })
  finishedAt!: string;

  @ApiProperty({ example: 420, description: 'Duração do último ciclo em milissegundos' })
  durationMs!: number;

  @ApiProperty({ example: 6, description: 'Quantidade de coletas gravadas no último ciclo' })
  recordsSaved!: number;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  errorStage!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  errorMessage!: string | null;
}

export class CollectionHealthResponseDto {
  @ApiProperty({ enum: ['running', 'success', 'failed', 'no_data'], example: 'success' })
  status!: CollectionOperationalStatus;

  @ApiProperty({ example: false })
  isRunning!: boolean;

  @ApiProperty({ example: 30, description: 'Intervalo efetivo de coleta em segundos' })
  effectiveIntervalSeconds!: number;

  @ApiProperty({ example: 30000, description: 'Intervalo efetivo de coleta em milissegundos' })
  effectiveIntervalMs!: number;

  @ApiProperty({ example: 30, description: 'Intervalo recomendado de polling para o frontend (teto de 60s)' })
  recommendedPollSeconds!: number;

  @ApiProperty({ example: 30000, description: 'Intervalo recomendado de polling em ms (teto de 60000ms)' })
  recommendedPollMs!: number;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-11-20T20:00:30.420Z' })
  nextRunAt!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-11-20T20:00:00.000Z' })
  lastRunAt!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-11-20T20:00:00.420Z' })
  lastFinishedAt!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 420 })
  lastDurationMs!: number | null;

  @ApiProperty({ example: 6 })
  recordsSaved!: number;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  errorStage!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: null })
  errorMessage!: string | null;

  @ApiPropertyOptional({ type: LastCycleHealthDto, nullable: true })
  lastCycle!: LastCycleHealthDto | null;
}
