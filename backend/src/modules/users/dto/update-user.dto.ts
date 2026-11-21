import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'Conta ativa; desativar bloqueia o login e os tokens já emitidos',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'O campo "active" deve ser verdadeiro ou falso.' })
  active?: boolean;
}
