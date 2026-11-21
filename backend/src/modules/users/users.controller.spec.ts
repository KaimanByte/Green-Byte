import { NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  const user = {
    id: 3,
    email: 'usuario@greenbyte.test',
    role: 'operator' as const,
    active: true,
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
  };
  const actor = { id: 1, email: 'admin@greenbyte.test', role: 'admin' as const, active: true, createdAt: user.createdAt };

  // sem a assinatura, `jest.Mock` aceita só `never` em mockResolvedValue/mockRejectedValue
  type ServiceMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  const serviceMock = (): ServiceMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

  let controller: UsersController;
  let usersService: {
    create: ServiceMock;
    findAll: ServiceMock;
    findById: ServiceMock;
    findByEmail: ServiceMock;
    update: ServiceMock;
    remove: ServiceMock;
  };

  beforeEach(() => {
    usersService = {
      create: serviceMock(),
      findAll: serviceMock(),
      findById: serviceMock(),
      findByEmail: serviceMock(),
      update: serviceMock(),
      remove: serviceMock(),
    };
    controller = new UsersController(usersService as unknown as UsersService);
  });

  it('encaminha os parâmetros para cada operação de usuário e devolve o resultado do serviço', async () => {
    const createDto = { email: user.email, hashPassword: 'SenhaSegura123!' };
    const updateDto = { email: 'novo@greenbyte.test' };
    usersService.create.mockResolvedValue(user);
    usersService.findAll.mockResolvedValue([user]);
    usersService.findById.mockResolvedValue(user);
    usersService.findByEmail.mockResolvedValue(user);
    usersService.update.mockResolvedValue({ ...user, email: updateDto.email });
    usersService.remove.mockResolvedValue(user);

    await expect(controller.create(createDto, actor)).resolves.toEqual(user);
    await expect(controller.findAll()).resolves.toEqual([user]);
    await expect(controller.findById(user.id)).resolves.toEqual(user);
    await expect(controller.findByEmail(user.email)).resolves.toEqual(user);
    await expect(controller.update(user.id, updateDto, actor)).resolves.toEqual({ ...user, email: updateDto.email });
    await expect(controller.remove(user.id, actor)).resolves.toEqual(user);

    expect(usersService.create).toHaveBeenCalledWith(createDto, actor);
    expect(usersService.findAll).toHaveBeenCalledWith();
    expect(usersService.findById).toHaveBeenCalledWith(user.id);
    expect(usersService.findByEmail).toHaveBeenCalledWith(user.email);
    expect(usersService.update).toHaveBeenCalledWith(user.id, updateDto, actor);
    expect(usersService.remove).toHaveBeenCalledWith(user.id, actor);
  });

  it('preserva o erro de usuário não encontrado retornado pela regra de negócio', async () => {
    usersService.findById.mockRejectedValue(new NotFoundException('User not found'));

    await expect(controller.findById(999)).rejects.toThrow('User not found');
  });
});
