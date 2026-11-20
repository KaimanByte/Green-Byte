import { NotFoundException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { jest } from '@jest/globals';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PublicUser } from './users.schema';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('UsersController', () => {
  const user: PublicUser = {
    id: 3,
    email: 'usuario@greenbyte.test',
    role: 'operator',
    isActive: true,
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
  };
  const actor: PublicUser = { ...user, id: 1, email: 'admin@greenbyte.test', role: 'admin' };

  let controller: UsersController;
  let usersService: {
    create: jest.Mock<UsersService['create']>;
    findAll: jest.Mock<UsersService['findAll']>;
    findById: jest.Mock<UsersService['findById']>;
    findByEmail: jest.Mock<UsersService['findByEmail']>;
    update: jest.Mock<UsersService['update']>;
    setActive: jest.Mock<UsersService['setActive']>;
    remove: jest.Mock<UsersService['remove']>;
  };

  beforeEach(() => {
    usersService = {
      create: jest.fn<UsersService['create']>().mockResolvedValue(user),
      findAll: jest.fn<UsersService['findAll']>().mockResolvedValue([user]),
      findById: jest.fn<UsersService['findById']>().mockResolvedValue(user),
      findByEmail: jest.fn<UsersService['findByEmail']>().mockResolvedValue(user),
      update: jest.fn<UsersService['update']>().mockResolvedValue({ ...user, role: 'admin' }),
      setActive: jest.fn<UsersService['setActive']>().mockResolvedValue({ ...user, isActive: false }),
      remove: jest.fn<UsersService['remove']>().mockResolvedValue(user),
    };
    controller = new UsersController(usersService as unknown as UsersService);
  });

  it('está protegido por JwtAuthGuard + RolesGuard e exige papel admin', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, UsersController)).toEqual([JwtAuthGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, UsersController)).toEqual(['admin']);
  });

  it('encaminha cada operação ao serviço, passando o admin autenticado nas ações sensíveis', async () => {
    const createDto = { email: user.email, hashPassword: 'SenhaSegura123!', role: 'operator' as const };

    await expect(controller.create(createDto, actor)).resolves.toEqual(user);
    await expect(controller.findAll()).resolves.toEqual([user]);
    await expect(controller.findById(user.id)).resolves.toEqual(user);
    await expect(controller.findByEmail(user.email)).resolves.toEqual(user);
    await expect(controller.update(user.id, { role: 'admin' }, actor)).resolves.toMatchObject({ role: 'admin' });
    await expect(controller.setStatus(user.id, { isActive: false }, actor)).resolves.toMatchObject({ isActive: false });
    await expect(controller.remove(user.id, actor)).resolves.toEqual(user);

    expect(usersService.create).toHaveBeenCalledWith(createDto, actor);
    expect(usersService.update).toHaveBeenCalledWith(user.id, { role: 'admin' }, actor);
    expect(usersService.setActive).toHaveBeenCalledWith(user.id, false, actor);
    expect(usersService.remove).toHaveBeenCalledWith(user.id, actor);
  });

  it('preserva o erro de usuário não encontrado', async () => {
    usersService.findById.mockRejectedValue(new NotFoundException('Usuário não encontrado.'));

    await expect(controller.findById(999)).rejects.toThrow('Usuário não encontrado.');
  });
});
