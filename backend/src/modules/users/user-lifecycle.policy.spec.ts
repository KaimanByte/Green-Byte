import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserLifecyclePolicy } from './user-lifecycle.policy';
import { PublicUser } from './users.schema';

const user = (overrides: Partial<PublicUser> = {}): PublicUser => ({
  id: 2,
  email: 'u@greenbyte.test',
  role: 'admin',
  isActive: true,
  createdAt: new Date('2026-11-01T00:00:00.000Z'),
  ...overrides,
});

describe('UserLifecyclePolicy', () => {
  const policy = new UserLifecyclePolicy();
  const actor = { id: 1 };

  it('aceita somente os papéis admin e operator', () => {
    expect(() => policy.assertValidRole('admin')).not.toThrow();
    expect(() => policy.assertValidRole('operator')).not.toThrow();
    for (const invalid of ['ADMIN', 'viewer', '', undefined, 1]) {
      expect(() => policy.assertValidRole(invalid)).toThrow(BadRequestException);
    }
  });

  it('desativação: bloqueia a própria conta e o último admin ativo; permite ativar sempre', () => {
    expect(() => policy.assertCanChangeStatus(actor, user({ id: 1 }), false, 5)).toThrow(ForbiddenException);
    expect(() => policy.assertCanChangeStatus(actor, user(), false, 1)).toThrow(BadRequestException);
    expect(() => policy.assertCanChangeStatus(actor, user(), false, 2)).not.toThrow();
    expect(() => policy.assertCanChangeStatus(actor, user({ role: 'operator' }), false, 1)).not.toThrow();
    expect(() => policy.assertCanChangeStatus(actor, user({ id: 1 }), true, 0)).not.toThrow();
  });

  it('remoção: bloqueia a própria conta e o último admin ativo', () => {
    expect(() => policy.assertCanRemove(actor, user({ id: 1, role: 'operator' }), 5)).toThrow(ForbiddenException);
    expect(() => policy.assertCanRemove(actor, user(), 1)).toThrow(BadRequestException);
    expect(() => policy.assertCanRemove(actor, user(), 2)).not.toThrow();
    // admin já desativado não é "admin ativo": pode ser removido
    expect(() => policy.assertCanRemove(actor, user({ isActive: false }), 1)).not.toThrow();
  });

  it('troca de papel: bloqueia rebaixar a si mesmo e o último admin ativo; promover ou manter igual é livre', () => {
    expect(() => policy.assertCanChangeRole(actor, user({ id: 1 }), 'operator', 5)).toThrow(ForbiddenException);
    expect(() => policy.assertCanChangeRole(actor, user(), 'operator', 1)).toThrow(BadRequestException);
    expect(() => policy.assertCanChangeRole(actor, user(), 'operator', 2)).not.toThrow();
    expect(() => policy.assertCanChangeRole(actor, user({ role: 'operator' }), 'admin', 0)).not.toThrow();
    expect(() => policy.assertCanChangeRole(actor, user({ id: 1, role: 'admin' }), 'admin', 1)).not.toThrow();
    expect(() => policy.assertCanChangeRole(actor, user({ role: 'operator' }), 'operator', 1)).not.toThrow();
  });
});
