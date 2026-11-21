import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Endereço de e-mail do usuário',
    example: 'dev@empresa.com',
  })
  @IsString({ message: 'O e-mail deve ser um texto.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email!: string;

  @ApiProperty({
    description: 'Senha do usuário em texto puro (mínimo de 8 caracteres)',
    example: 'SenhaSegura123!',
    minLength: 8,
  })
  @IsString({ message: 'A senha deve ser um texto.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @MinLength(8, { message: 'A senha precisa ter pelo menos 8 caracteres.' })
  hashPassword!: string;
}