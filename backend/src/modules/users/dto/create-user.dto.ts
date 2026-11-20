import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { USER_ROLES, type UserRole } from '../user-role';

export class CreateUserDto {
  @ApiProperty({ description: 'Endereço de e-mail do usuário', example: 'dev@empresa.com' })
  @IsString({ message: 'O e-mail deve ser um texto.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email!: string;

  @ApiProperty({
    description: 'Senha do usuário em texto puro (mínimo de 8 caracteres); é gravada apenas como hash',
    example: 'SenhaSegura123!',
    minLength: 8,
  })
  @IsString({ message: 'A senha deve ser um texto.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @MinLength(8, { message: 'A senha precisa ter pelo menos 8 caracteres.' })
  hashPassword!: string;

  @ApiPropertyOptional({ enum: USER_ROLES, default: 'operator', description: 'Papel de acesso' })
  @IsOptional()
  @IsIn(USER_ROLES, { message: 'Papel inválido: use "admin" ou "operator".' })
  role?: UserRole;

  @ApiPropertyOptional({ default: true, description: 'Conta ativa (pode autenticar)' })
  @IsOptional()
  @IsBoolean({ message: 'O campo "isActive" deve ser verdadeiro ou falso.' })
  isActive?: boolean;
}
