/** Papéis de acesso aceitos pelo sistema (AU-06). Qualquer outro valor é rejeitado. */
export const USER_ROLES = ['admin', 'operator'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ADMIN_ROLE: UserRole = 'admin';
export const OPERATOR_ROLE: UserRole = 'operator';

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}
