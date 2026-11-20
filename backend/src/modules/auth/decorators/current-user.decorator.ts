import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest, AuthenticatedUser } from '../authenticated-user';

/** Extrai da requisição o usuário autenticado pelo `JwtAuthGuard`. */
export function extractCurrentUser(context: ExecutionContext): AuthenticatedUser {
  const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
  if (!user) {
    throw new UnauthorizedException('Autenticação necessária.');
  }
  return user;
}

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  extractCurrentUser(context),
);
