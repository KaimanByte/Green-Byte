import type { PublicUser } from '../users/users.schema';

/** Usuário anexado à requisição pela `JwtStrategy` (sem hash de senha). */
export type AuthenticatedUser = PublicUser;

export interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

/** Conteúdo assinado no JWT. */
export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}
