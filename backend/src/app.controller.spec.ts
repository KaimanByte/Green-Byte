import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('deve retornar um objeto contendo o mapa de rotas da API', () => {
      // Chama o método do seu controller (getHello() ou o nome que estiver lá)
      const result = appController.getHello(); 

      expect(typeof result).toBe('object');
      // Valida se o objeto retornado contém a rota do Swagger
      expect(result).toHaveProperty('swagger', '/api/docs');
      // Valida se contém a listagem de regiões
      expect(result).toHaveProperty('todas as regiões', 'GET /regions');
    });
  });
});