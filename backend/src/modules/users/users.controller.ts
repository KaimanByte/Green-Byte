import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PublicUser } from './users.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/authenticated-user';

/** Gestão de usuários e papéis: exclusiva de administradores com conta ativa (AU-06). */
@ApiTags('Usuários')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou de conta desativada.' })
@ApiForbiddenResponse({ description: 'Apenas administradores podem gerir usuários.' })
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um usuário', description: 'Papel padrão: operator. Conta ativa por padrão.' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ description: 'Usuário criado.', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos ou papel diferente de admin/operator.' })
  @ApiConflictResponse({ description: 'Já existe um usuário com este e-mail.' })
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthenticatedUser): Promise<PublicUser> {
    return this.usersService.create(dto, actor);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os usuários' })
  @ApiOkResponse({ type: [UserResponseDto] })
  findAll(): Promise<PublicUser[]> {
    return this.usersService.findAll();
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Obtém um usuário pelo e-mail' })
  @ApiParam({ name: 'email', example: 'user@example.com' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  findByEmail(@Param('email') email: string): Promise<PublicUser> {
    return this.usersService.findByEmail(email);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém um usuário pelo ID' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  findById(@Param('id', ParseIntPipe) id: number): Promise<PublicUser> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edita e-mail, senha e/ou papel',
    description: 'Não é possível rebaixar a própria conta nem o último administrador ativo.',
  })
  @ApiParam({ name: 'id', example: '1' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Dados/papel inválidos ou rebaixaria o último admin ativo.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @ApiConflictResponse({ description: 'Já existe um usuário com este e-mail.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PublicUser> {
    return this.usersService.update(id, dto, actor);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Ativa ou desativa uma conta',
    description: 'Conta desativada não faz login e seus tokens deixam de valer. Não é possível desativar a própria conta nem o último admin ativo.',
  })
  @ApiParam({ name: 'id', example: '2' })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Desativaria o último administrador ativo.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PublicUser> {
    return this.usersService.setActive(id, dto.isActive, actor);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove um usuário',
    description: 'Não é possível remover a própria conta nem o último administrador ativo.',
  })
  @ApiParam({ name: 'id', example: '2' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Removeria o último administrador ativo.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: AuthenticatedUser): Promise<PublicUser> {
    return this.usersService.remove(id, actor);
  }
}
