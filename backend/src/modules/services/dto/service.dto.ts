import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceLocationDto {
  @ApiProperty({ example: 'Brazil', description: 'País onde o serviço está hospedado' })
  country: string;

  @ApiProperty({ example: 'Sudeste', description: 'Região geográfica' })
  region: string;

  @ApiPropertyOptional({ example: 'São Paulo', description: 'Cidade da hospedagem', type: String, nullable: true })
  city: string | null;

  @ApiPropertyOptional({ example: -23.5505, description: 'Latitude', type: Number, nullable: true })
  latitude: number | null;

  @ApiPropertyOptional({ example: -46.6333, description: 'Longitude', type: Number, nullable: true })
  longitude: number | null;
}

export class ServiceResponseDto {
  @ApiProperty({ example: 'billing-api', description: 'Identificador único do serviço' })
  id: string;

  @ApiProperty({ example: 'Billing API', description: 'Nome legível do serviço' })
  name: string;

  @ApiProperty({ example: 'registered', description: 'Status atual do serviço' })
  status: string;

  @ApiProperty({ example: 'br-sudeste', description: 'Código da região de infraestrutura' })
  regionCode: string;

  @ApiProperty({
    description: 'Detalhes geográficos e de localização da região do serviço',
    type: () => ServiceLocationDto, // Ensina o Swagger a montar o objeto aninhado
  })
  location: ServiceLocationDto;

  @ApiPropertyOptional({ example: '/api/v1/metrics', description: 'Caminho para a rota de métricas', type: String, nullable: true })
  metricsPath: string | null;
}