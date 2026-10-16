import { ApiProperty } from '@nestjs/swagger';

export class CollectionResponseDto {
  @ApiProperty({ example: 1, description: 'ID da coleta' })
  id: number;

  @ApiProperty({ example: 'billing-api', description: 'Identificador do serviço' })
  serviceId: string;

  @ApiProperty({ example: '2026-10-16T13:14:00.000Z', description: 'Data e hora da coleta' })
  timestamp: Date;

  @ApiProperty({ example: 62.67, description: 'Uso de CPU (%)' })
  cpuPercent: number;

  @ApiProperty({ example: 3.17, description: 'Uso de memória (GB)' })
  memoryGb: number;

  @ApiProperty({ example: 19.26, description: 'Uso de disco (GB)' })
  diskGb: number;

  @ApiProperty({ example: 0.05, description: 'Energia calculada consumida (kWh)' })
  energyKwh: number;

  @ApiProperty({ example: 4.25, description: 'Emissões estimadas (gCO2e)' })
  co2Emissions: number;
}

export class RegionEmissionsDto {
  @ApiProperty({ example: 'br-sudeste', description: 'Código da região' })
  regionCode: string;

  @ApiProperty({ example: 150.5, description: 'Total de energia consumida na região (kWh)' })
  totalEnergyKwh: number;

  @ApiProperty({ example: 12792.5, description: 'Total de emissões na região (gCO2e)' })
  totalCo2Emissions: number;
}

export class ServiceEmissionsDto {
  @ApiProperty({ example: 'billing-api', description: 'ID do serviço' })
  serviceId: string;

  @ApiProperty({ example: 45.2, description: 'Total de energia consumida pelo serviço (kWh)' })
  totalEnergyKwh: number;

  @ApiProperty({ example: 3842.0, description: 'Total de emissões do serviço (gCO2e)' })
  totalCo2Emissions: number;
}

export class SyncCollectionsResponseDto {
  @ApiProperty({ example: 5, description: 'Quantidade de serviços coletados com sucesso' })
  total: number;

  @ApiProperty({ type: [CollectionResponseDto], description: 'Lista das coletas realizadas' })
  collections: CollectionResponseDto[];
}