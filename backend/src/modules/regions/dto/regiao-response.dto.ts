import { ApiProperty } from '@nestjs/swagger';

export class RegiaoResponseDto {
  @ApiProperty({ example: 'br-sudeste', description: 'Código da região' })
  regionCode: string;

  @ApiProperty({ example: 'Brazil', description: 'País da região' })
  country: string;

  @ApiProperty({ example: 'Sudeste', description: 'Nome da região' })
  region: string;

  @ApiProperty({
    example: 'Sao Paulo',
    description: 'Cidade, quando informada pela API externa; caso contrário, null',
    type: String,
    nullable: true,
  })
  city: string | null;

  @ApiProperty({ example: -23.5505, description: 'Latitude aproximada da região' })
  latitude: number;

  @ApiProperty({ example: -46.6333, description: 'Longitude aproximada da região' })
  longitude: number;

  @ApiProperty({
    example: 85,
    description: 'Intensidade de carbono da matriz elétrica, em gCO₂e/kWh',
  })
  carbonIntensity: number;

  @ApiProperty({
    example: 83,
    description: 'Participação estimada de fontes renováveis na matriz elétrica (%)',
  })
  renewableSharePercent: number;
}
