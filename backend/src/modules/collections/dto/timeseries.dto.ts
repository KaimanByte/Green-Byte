import { ApiProperty } from '@nestjs/swagger';
import { HistoryUnitsDto, PeriodDto } from './history-summary.dto';

/**
 * Um ponto da série temporal: as coletas gravadas dentro de um intervalo
 * [timestamp, timestamp + bucketSeconds), resumidas pela MÉDIA de cada métrica.
 * Não é soma acumulada: cada ponto depende só das coletas do próprio intervalo.
 */
export class TimeSeriesPointDto {
  @ApiProperty({ example: '2026-10-01T10:00:00.000Z', description: 'Início do intervalo (ISO 8601)' })
  timestamp: string;

  @ApiProperty({ example: 10, description: 'Quantidade de coletas agregadas no intervalo' })
  collectionsCount: number;

  @ApiProperty({ example: 2, description: 'Quantidade de serviços distintos com coleta no intervalo' })
  servicesCount: number;

  @ApiProperty({ example: 57.3, description: 'Média de uso de CPU (%) no intervalo' })
  cpuPercent: number;

  @ApiProperty({ example: 3.1, description: 'Média de memória (GB) no intervalo' })
  memoryGb: number;

  @ApiProperty({ example: 18.7, description: 'Média de disco (GB) no intervalo' })
  diskGb: number;

  @ApiProperty({ example: 0.00042, description: 'Média de energia por coleta (kWh) no intervalo' })
  energyKwh: number;

  @ApiProperty({ example: 0.036, description: 'Média de emissões por coleta (gCO2e) no intervalo' })
  co2Emissions: number;
}

export class TimeSeriesResponseDto {
  @ApiProperty({ example: 'billing-api', nullable: true, type: String, description: 'Serviço filtrado; null = todos os serviços' })
  serviceId: string | null;

  @ApiProperty({ type: PeriodDto })
  period: PeriodDto;

  @ApiProperty({ example: 900, description: 'Tamanho de cada intervalo, em segundos' })
  bucketSeconds: number;

  @ApiProperty({ example: 'avg', description: 'Agregação aplicada às coletas de cada intervalo' })
  aggregation: 'avg';

  @ApiProperty({ type: HistoryUnitsDto })
  units: HistoryUnitsDto;

  @ApiProperty({ example: 96, description: 'Quantidade de pontos (intervalos sem coleta não são retornados)' })
  total: number;

  @ApiProperty({ type: [TimeSeriesPointDto], description: 'Pontos em ordem cronológica crescente' })
  points: TimeSeriesPointDto[];
}

/** Série temporal de UM serviço dentro da comparação histórica. */
export class TimeSeriesCompareSeriesDto {
  @ApiProperty({ example: 'billing-api' })
  serviceId: string;

  @ApiProperty({ example: 'Billing API' })
  name: string;

  @ApiProperty({ example: 'BR-SP' })
  regionCode: string;

  @ApiProperty({ example: 96, description: 'Quantidade de pontos desta série (intervalos sem coleta não são retornados)' })
  total: number;

  @ApiProperty({
    type: [TimeSeriesPointDto],
    description: 'Pontos em ordem cronológica crescente, só com coletas deste serviço (servicesCount = 1)',
  })
  points: TimeSeriesPointDto[];
}

/**
 * Comparação histórica: uma série por serviço, todas com o mesmo período e o mesmo
 * `bucketSeconds` (intervalos alinhados no mesmo `from`), para comparação justa.
 */
export class TimeSeriesCompareResponseDto {
  @ApiProperty({ type: PeriodDto })
  period: PeriodDto;

  @ApiProperty({ example: 900, description: 'Tamanho de cada intervalo, em segundos (igual para todas as séries)' })
  bucketSeconds: number;

  @ApiProperty({ example: 'avg', description: 'Agregação aplicada às coletas de cada intervalo, por serviço' })
  aggregation: 'avg';

  @ApiProperty({ type: HistoryUnitsDto })
  units: HistoryUnitsDto;

  @ApiProperty({ example: 3, description: 'Quantidade de séries (serviços comparados)' })
  total: number;

  @ApiProperty({ type: [TimeSeriesCompareSeriesDto], description: 'Uma série por serviço, na ordem dos ids informados' })
  series: TimeSeriesCompareSeriesDto[];
}
