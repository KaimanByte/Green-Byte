import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../roles';

function contextFor(role?: Role): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { id: 1, email: 'a@b.c', role } : undefined }) }),
  } as unknown as ExecutionContext;
}

function guardAllowing(roles: Role[] | undefined): RolesGuard {
  const reflector = { getAllAndOverride: () => roles } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('sem @Roles, qualquer usuário autenticado passa', () => {
    expect(guardAllowing(undefined).canActivate(contextFor('operator'))).toBe(true);
  });

  it('libera quem tem um dos papéis exigidos', () => {
    expect(guardAllowing(['admin', 'operator']).canActivate(contextFor('operator'))).toBe(true);
  });

  it('bloqueia com 403 quem não tem o papel', () => {
    expect(() => guardAllowing(['admin']).canActivate(contextFor('operator'))).toThrow(ForbiddenException);
  });

  it('bloqueia quando não há usuário na requisição', () => {
    expect(() => guardAllowing(['admin']).canActivate(contextFor())).toThrow(ForbiddenException);
  });
});
