import { ApiProperty } from '@nestjs/swagger';

export class LocalizacaoDto {
  @ApiProperty({ example: 'br-sudeste', description: 'Código da região' })
  codigoRegiao: string;

  @ApiProperty({ example: 'Brazil', description: 'País de hospedagem' })
  pais: string;

  @ApiProperty({ example: 'Sudeste', description: 'Região geográfica' })
  regiao: string;

  @ApiProperty({ example: 'Sao Paulo', description: 'Cidade (se disponível)', required: false })
  cidade?: string;
}

export class ServicoResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID interno do banco' })
  id: string;

  @ApiProperty({ example: 'Billing API', description: 'Nome do microsserviço' })
  nome: string;

  @ApiProperty({ example: 'ativo', description: 'Estado atual do serviço' })
  status: string;

  @ApiProperty({ type: LocalizacaoDto })
  localizacao: LocalizacaoDto;
}