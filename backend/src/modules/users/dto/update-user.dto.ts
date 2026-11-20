import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/** E-mail, senha, papel e estado ativo (ativação dedicada também disponível em `PATCH /users/:id/status`). */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
