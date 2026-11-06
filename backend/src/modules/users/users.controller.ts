import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria um novo usuário',
    description: 'Cria um novo usuário com base nos dados fornecidos.',
  })
  @ApiBody({
    description: 'Dados do usuário a ser criado',
    type: CreateUserDto,
  })
  @ApiCreatedResponse({
    description: 'Usuário criado com sucesso.',
    type: UserResponseDto,
  })
  @ApiConflictResponse({
    description: 'Já existe um usuário com este email.',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista todos os usuários',
    description: 'Retorna uma lista de todos os usuários cadastrados.',
  })
  @ApiOkResponse({
    description: 'Lista de usuários retornada com sucesso.',
    type: [UserResponseDto],
  })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtém um usuário pelo ID',
    description: 'Retorna os dados de um usuário específico com base no ID fornecido.',
  })
  @ApiParam({
    name: 'id',
    example: '1',
  })
  @ApiOkResponse({
    description: 'Usuário retornado com sucesso.',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
  })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Get('email/:email')
  @ApiOperation({
    summary: 'Obtém um usuário pelo email',
    description: 'Retorna os dados de um usuário específico com base no email fornecido.',
  })
  @ApiParam({
    name: 'email',
    example: 'user@example.com',
  })
  @ApiOkResponse({
    description: 'Usuário retornado com sucesso.',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
  })
  async findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza um usuário',
    description: 'Atualiza os dados de um usuário específico com base no ID fornecido.',
  })
  @ApiParam({
    name: 'id',
    example: '1',
  })
  @ApiBody({
    description: 'Dados do usuário a serem atualizados',
    type: UpdateUserDto,
  })
  @ApiOkResponse({
    description: 'Usuário atualizado com sucesso.',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
  })
  @ApiConflictResponse({
    description: 'Já existe um usuário com este email.',
  })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove um usuário',
    description: 'Remove um usuário específico com base no ID fornecido.',
  })
  @ApiParam({
    name: 'id',
    example: '1',
  })
  @ApiOkResponse({
    description: 'Usuário removido com sucesso.',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
