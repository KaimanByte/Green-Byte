import { ApiProperty } from '@nestjs/swagger';
import { USER_ROLES, type UserRole } from '../user-role';

/** Usuário exposto pela API. O hash da senha nunca faz parte da resposta. */
export class UserResponseDto {
  @ApiProperty({ description: 'ID único do usuário', example: 1 })
  id!: number;

  @ApiProperty({ description: 'E-mail cadastrado', example: 'user@example.com' })
  email!: string;

  @ApiProperty({ enum: USER_ROLES, example: 'operator', description: 'Papel de acesso' })
  role!: UserRole;

  @ApiProperty({ example: true, description: 'Conta ativa' })
  isActive!: boolean;

  @ApiProperty({ description: 'Data e hora de criação do registro', example: '2026-11-05T20:00:00.000Z' })
  createdAt!: Date;
}
