import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { UserRole } from '../../users/user-role';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

/**
 * Composição padrão de proteção de rota: JWT válido + conta ativa + papel permitido,
 * com a documentação Swagger correspondente.
 */
export function Authorize(...roles: UserRole[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(...roles),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou de conta desativada.' }),
    ApiForbiddenResponse({ description: `Papel sem permissão. Permitidos: ${roles.join(', ')}.` }),
  );
}
