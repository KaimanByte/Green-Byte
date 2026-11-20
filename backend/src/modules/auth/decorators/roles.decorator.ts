import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../users/user-role';

export const ROLES_KEY = 'roles';

/** Papéis autorizados na rota/controller. Use junto com `JwtAuthGuard` e `RolesGuard`. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
