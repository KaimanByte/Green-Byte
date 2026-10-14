import { ApiProperty } from '@nestjs/swagger';

export class LocalizacaoDto {
  @ApiProperty({ example: 'br-sudeste', description: 'Código da região' })
  codigoRegiao: string;

  @ApiProperty({ example: 'Brazil', description: 'País de hospedagem' })
  pais: string;

  @ApiProperty({ example: 'Sudeste', description: 'Região geográfica' })
  regiao: string;

  @ApiProperty({
    example: 'Sao Paulo',
    description: 'Cidade, quando informada pela API externa; caso contrário, null',
    nullable: true,
  })
  cidade: string | null;
}

export class ServicoResponseDto {
  @ApiProperty({ example: 'billing-api', description: 'Identificador do serviço' })
  id: string;

  @ApiProperty({ example: 'Billing API', description: 'Nome de exibição do serviço' })
  nome: string;

  @ApiProperty({
    example: 'registrado',
    description:
      'Estado de registro na API de origem. A API externa não fornece estado de saúde operacional neste endpoint.',
  })
  status: string;

  @ApiProperty({ type: LocalizacaoDto })
  localizacao: LocalizacaoDto;
}
