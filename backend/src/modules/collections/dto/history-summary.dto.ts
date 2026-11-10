import { ApiProperty } from '@nestjs/swagger';
import { CollectionResponseDto } from './collection.dto';

export class PeriodDto {
  @ApiProperty({ example: '2026-10-01T00:00:00.000Z', description: 'Início do período considerado (ISO 8601)' })
  from: string;

  @ApiProperty({ example: '2026-10-02T00:00:00.000Z', description: 'Fim do período considerado (ISO 8601)' })
  to: string;
}

export class HistoryUnitsDto {
  @ApiProperty({ example: 'kWh' }) energyKwh: 'kWh';
  @ApiProperty({ example: 'gCO2e' }) co2Emissions: 'gCO2e';
  @ApiProperty({ example: '%' }) cpuPercent: '%';
  @ApiProperty({ example: 'GB' }) memoryGb: 'GB';
  @ApiProperty({ example: 'GB' }) diskGb: 'GB';
}

export class SummaryUnitsDto {
  @ApiProperty({ example: 'kWh' }) energyKwh: 'kWh';
  @ApiProperty({ example: 'gCO2e' }) co2Emissions: 'gCO2e';
}

export const HISTORY_UNITS: HistoryUnitsDto = {
  energyKwh: 'kWh',
  co2Emissions: 'gCO2e',
  cpuPercent: '%',
  memoryGb: 'GB',
  diskGb: 'GB',
};

export const SUMMARY_UNITS: SummaryUnitsDto = {
  energyKwh: 'kWh',
  co2Emissions: 'gCO2e',
};

export class ServiceHistoryResponseDto {
  @ApiProperty({ example: 'billing-api' })
  serviceId: string;

  @ApiProperty({ type: PeriodDto })
  period: PeriodDto;

  @ApiProperty({ type: HistoryUnitsDto, description: 'Unidades de cada métrica dos pontos' })
  units: HistoryUnitsDto;

  @ApiProperty({ example: 2, description: 'Quantidade de pontos retornados' })
  total: number;

  @ApiProperty({ type: [CollectionResponseDto], description: 'Série temporal em ordem cronológica' })
  points: CollectionResponseDto[];
}

export class SummaryTotalsDto {
  @ApiProperty({ example: 12.5 }) energyKwh: number;
  @ApiProperty({ example: 1062.5 }) co2Emissions: number;
}

export class SummaryServicesDto {
  @ApiProperty({ example: 8 }) active: number;
  @ApiProperty({ example: 1 }) unavailable: number;
  @ApiProperty({ example: 2 }) withoutMetrics: number;
}

export class SummaryResponseDto {
  @ApiProperty({ type: PeriodDto })
  period: PeriodDto;

  @ApiProperty({ type: SummaryUnitsDto })
  units: SummaryUnitsDto;

  @ApiProperty({ type: SummaryTotalsDto })
  totals: SummaryTotalsDto;

  @ApiProperty({ type: SummaryServicesDto, description: 'Contagem de serviços por estado no período' })
  services: SummaryServicesDto;
}

