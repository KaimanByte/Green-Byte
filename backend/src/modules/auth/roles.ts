/**
 * Papéis de acesso à área administrativa.
 * - admin: tudo, inclusive gerenciar usuários;
 * - operator: ajusta coleta e parâmetros da máquina, lê a auditoria e executa sincronizações manuais.
 */
export const ROLES = ['admin', 'operator'] as const;
export type Role = (typeof ROLES)[number];

export const DEFAULT_ROLE: Role = 'operator';

/** Usuário autenticado colocado em `request.user` pelo JwtStrategy (sem o hash da senha). */
export interface AuthenticatedUser {
  id: number;
  email: string;
  role: Role;
  active: boolean;
  createdAt: Date;
}
