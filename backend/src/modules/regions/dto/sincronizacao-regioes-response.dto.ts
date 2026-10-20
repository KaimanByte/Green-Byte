import { ApiProperty } from '@nestjs/swagger';
import { RegiaoResponseDto } from './regiao-response.dto';

export class SincronizacaoRegioesResponseDto {
  @ApiProperty({
    example: 5,
    description: 'Quantidade de regiões gravadas (inseridas ou atualizadas)',
  })
  total: number;

  @ApiProperty({ type: [RegiaoResponseDto] })
  regioes: RegiaoResponseDto[];
}
