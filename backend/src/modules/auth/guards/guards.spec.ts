import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import type { AuthenticatedUser } from '../authenticated-user';
import { UsersController } from '../../users/users.controller';
import { ServicesController } from '../../services/services.controller';
import { RegionsController } from '../../regions/regions.controller';
import { CollectionsController } from '../../collections/collections.controller';

const makeUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  id: 1,
  email: 'admin@greenbyte.test',
  role: 'admin',
  isActive: true,
  createdAt: new Date('2026-11-01T00:00:00.000Z'),
  ...overrides,
});

type Handler = (...args: never[]) => unknown;

/** ExecutionContext mínimo apontando para um método real de controller (metadados reais). */
function contextFor(
  controller: abstract new (...args: never[]) => object,
  handler: Handler,
  user?: AuthenticatedUser,
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard();

  it('401 quando não há usuário autenticado (token ausente/ inválido)', () => {
    expect(() => guard.handleRequest(null, false)).toThrow(UnauthorizedException);
    expect(() => guard.handleRequest(new Error('jwt expired'), false)).toThrow(
      'Autenticação necessária: envie um token Bearer válido.',
    );
  });

  it('preserva a mensagem de 401 da estratégia (ex.: conta desativada)', () => {
    const err = new UnauthorizedException('Acesso não autorizado. Conta desativada.');
    expect(() => guard.handleRequest(err, false)).toThrow('Acesso não autorizado. Conta desativada.');
  });

  it('devolve o usuário quando o token é válido', () => {
    const user = makeUser();
    expect(guard.handleRequest(null, user)).toBe(user);
  });
});

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const usersHandlers: Handler[] = [
    UsersController.prototype.create,
    UsersController.prototype.findAll,
    UsersController.prototype.update,
    UsersController.prototype.setStatus,
    UsersController.prototype.remove,
  ];
  const syncRoutes: Array<[abstract new (...args: never[]) => object, Handler]> = [
    [ServicesController, ServicesController.prototype.syncServices],
    [RegionsController, RegionsController.prototype.syncRegions],
    [CollectionsController, CollectionsController.prototype.syncCollections],
  ];

  it.each(usersHandlers.map((h) => [h.name, h]))('/users (%s): admin passa', (_name, handler) => {
    expect(guard.canActivate(contextFor(UsersController, handler, makeUser()))).toBe(true);
  });

  it.each(usersHandlers.map((h) => [h.name, h]))('/users (%s): operator recebe 403', (_name, handler) => {
    expect(() => guard.canActivate(contextFor(UsersController, handler, makeUser({ role: 'operator' })))).toThrow(
      ForbiddenException,
    );
  });

  it.each(syncRoutes.map(([c, h]) => [c.name, c, h] as const))(
    'POST sync (%s): admin e operator passam',
    (_name, controller, handler) => {
      expect(guard.canActivate(contextFor(controller, handler, makeUser()))).toBe(true);
      expect(guard.canActivate(contextFor(controller, handler, makeUser({ role: 'operator' })))).toBe(true);
    },
  );

  it('403 para conta desativada, mesmo sendo admin', () => {
    expect(() =>
      guard.canActivate(contextFor(UsersController, UsersController.prototype.findAll, makeUser({ isActive: false }))),
    ).toThrow(new ForbiddenException('Conta desativada.'));
  });

  it('401 quando a requisição não tem usuário (guard usado sem autenticação)', () => {
    expect(() => guard.canActivate(contextFor(UsersController, UsersController.prototype.findAll))).toThrow(
      UnauthorizedException,
    );
  });

  it('rota sem @Roles libera qualquer usuário autenticado e ativo', () => {
    class OpenController {
      open(): void {}
    }
    expect(
      guard.canActivate(contextFor(OpenController, OpenController.prototype.open, makeUser({ role: 'operator' }))),
    ).toBe(true);
  });
});
