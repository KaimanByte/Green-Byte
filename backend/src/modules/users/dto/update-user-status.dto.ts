import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ example: false, description: 'true ativa a conta; false desativa (bloqueia login e tokens)' })
  @IsBoolean({ message: 'O campo "isActive" deve ser verdadeiro ou falso.' })
  isActive!: boolean;
}
