import { jest } from '@jest/globals';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let login: jest.MockedFunction<AuthService['login']>;

  beforeEach(() => {
    login = jest.fn<AuthService['login']>();
    controller = new AuthController({ login } as unknown as AuthService);
  });

  it('delega o login ao serviço com o DTO recebido e devolve sua resposta', async () => {
    const dto = { email: 'admin@greenbyte.test', password: 'SenhaSegura123!' };
    const response = {
      access_token: 'jwt-assinado',
      user: { id: 7, email: dto.email, createdAt: '2026-11-01T00:00:00.000Z' },
    };
    login.mockResolvedValue(response);

    await expect(controller.login(dto)).resolves.toEqual(response);
    expect(login).toHaveBeenCalledTimes(1);
    expect(login).toHaveBeenCalledWith(dto);
  });
});
