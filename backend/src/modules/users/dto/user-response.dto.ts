import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: 1,
  })
  id!: number;

  @ApiProperty({
    description: 'E-mail cadastrado',
    example: 'user@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Papel de acesso',
    enum: ['admin', 'operator'],
    example: 'admin',
  })
  role!: string;

  @ApiProperty({
    description: 'Conta ativa (desativada não faz login)',
    example: true,
  })
  active!: boolean;

  @ApiProperty({
    description: 'Data e hora de criação do registro',
    example: '2026-11-05T20:00:00.000Z',
  })
  createdAt!: Date;
}
