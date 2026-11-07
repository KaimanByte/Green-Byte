import { ApiProperty } from '@nestjs/swagger';
import { PeriodDto, SummaryUnitsDto } from './history-summary.dto';
import type { RankingMetric, ServiceIndicatorState } from '../environment-indicators.types';

export class ServiceImpactItemDto {
  @ApiProperty({ example: 'billing-api' })
  serviceId: string;

  @ApiProperty({ example: 'Billing API' })
  name: string;

  @ApiProperty({ example: 'br-sudeste' })
  regionCode: string;

  @ApiProperty({ enum: ['active', 'unavailable', 'no_metrics'], example: 'active' })
  state: ServiceIndicatorState;

  @ApiProperty({ example: 12 })
  collectionsCount: number;

  @ApiProperty({ example: 4.25, description: '0 quando indisponível ou sem métricas' })
  energyKwh: number;

  @ApiProperty({ example: 361.25, description: '0 quando indisponível ou sem métricas' })
  co2Emissions: number;
}

export class RankedServiceItemDto extends ServiceImpactItemDto {
  @ApiProperty({ example: 1, description: 'Posição no ranking (1 = maior impacto)' })
  rank: number;
}

export class RankingResponseDto {
  @ApiProperty({ enum: ['energia', 'co2e'], example: 'co2e' })
  metric: RankingMetric;

  @ApiProperty({ type: PeriodDto })
  period: PeriodDto;

  @ApiProperty({ type: SummaryUnitsDto })
  units: SummaryUnitsDto;

  @ApiProperty({ example: 3 })
  total: number;

  @ApiProperty({ type: [RankedServiceItemDto] })
  items: RankedServiceItemDto[];
}

export class CompareResponseDto {
  @ApiProperty({ type: PeriodDto })
  period: PeriodDto;

  @ApiProperty({ type: SummaryUnitsDto })
  units: SummaryUnitsDto;

  @ApiProperty({ example: 2 })
  total: number;

  @ApiProperty({ type: [ServiceImpactItemDto], description: 'Na mesma ordem dos IDs solicitados' })
  items: ServiceImpactItemDto[];
}

