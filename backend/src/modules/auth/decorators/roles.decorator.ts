import { SetMetadata } from '@nestjs/common';
import { Role } from '../roles';

export const ROLES_KEY = 'roles';

/** Restringe a rota (ou o controller inteiro) aos papéis informados. Usar junto com o RolesGuard. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
