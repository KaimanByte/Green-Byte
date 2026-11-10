import { NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  const user = {
    id: 3,
    email: 'usuario@greenbyte.test',
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
  };

  let controller: UsersController;
  let usersService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    findByEmail: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    usersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
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

    await expect(controller.create(createDto)).resolves.toEqual(user);
    await expect(controller.findAll()).resolves.toEqual([user]);
    await expect(controller.findById(user.id)).resolves.toEqual(user);
    await expect(controller.findByEmail(user.email)).resolves.toEqual(user);
    await expect(controller.update(user.id, updateDto)).resolves.toEqual({ ...user, email: updateDto.email });
    await expect(controller.remove(user.id)).resolves.toEqual(user);

    expect(usersService.create).toHaveBeenCalledWith(createDto);
    expect(usersService.findAll).toHaveBeenCalledWith();
    expect(usersService.findById).toHaveBeenCalledWith(user.id);
    expect(usersService.findByEmail).toHaveBeenCalledWith(user.email);
    expect(usersService.update).toHaveBeenCalledWith(user.id, updateDto);
    expect(usersService.remove).toHaveBeenCalledWith(user.id);
  });

  it('preserva o erro de usuário não encontrado retornado pela regra de negócio', async () => {
    usersService.findById.mockRejectedValue(new NotFoundException('User not found'));

    await expect(controller.findById(999)).rejects.toThrow('User not found');
  });
});
