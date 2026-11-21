import { ApiProperty } from '@nestjs/swagger';

export class SettingsValuesDto {
  @ApiProperty({ example: 30, description: 'Intervalo entre coletas (s)' })
  collectionIntervalSeconds!: number;

  @ApiProperty({ example: 100, description: 'Potência da CPU a 100% (W)' })
  cpuMaxWatts!: number;

  @ApiProperty({ example: 0.375, description: 'W por GB de memória' })
  ramWattsPerGb!: number;

  @ApiProperty({ example: 0.01, description: 'W por GB de disco' })
  diskWattsPerGb!: number;

  @ApiProperty({ example: 0.02, description: 'W por GB de rede' })
  networkWattsPerGb!: number;
}

class RangeDto {
  @ApiProperty({ example: 5 })
  min!: number;

  @ApiProperty({ example: 86400 })
  max!: number;
}

class SettingsLimitsDto {
  @ApiProperty({ type: RangeDto }) collectionIntervalSeconds!: RangeDto;
  @ApiProperty({ type: RangeDto }) cpuMaxWatts!: RangeDto;
  @ApiProperty({ type: RangeDto }) ramWattsPerGb!: RangeDto;
  @ApiProperty({ type: RangeDto }) diskWattsPerGb!: RangeDto;
  @ApiProperty({ type: RangeDto }) networkWattsPerGb!: RangeDto;
}

export class SettingsResponseDto extends SettingsValuesDto {
  @ApiProperty({ example: '2026-11-16T18:00:00.000Z', description: 'Última alteração' })
  updatedAt!: Date;

  @ApiProperty({ type: SettingsValuesDto, description: 'Valores padrão do modelo (para "restaurar padrão")' })
  defaults!: SettingsValuesDto;

  @ApiProperty({ type: SettingsLimitsDto, description: 'Faixa aceita em cada campo' })
  limits!: SettingsLimitsDto;
}
