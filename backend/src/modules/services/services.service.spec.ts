import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadGatewayException,
  GatewayTimeoutException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';

describe('ServicesService', () => {
  let service: ServicesService;
  let repository: {
    findById: jest.Mock;
    upsertMany: jest.Mock;
  };
  let fetchMock: jest.Mock;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    // Configura as variáveis de ambiente e o mock do fetch para o ambiente de testes
    process.env.METRICS_API_BASE_URL = 'https://metrics.unilaunch.org';
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    repository = {
      findById: jest.fn(),
      upsertMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: ServicesRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.METRICS_API_BASE_URL;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllServices', () => {
    it('deve buscar na API, retornar os DTOs e aguardar o upsert no banco', async () => {
      const externalPayload = [
        {
          id: 'srv-1',
          name: 'Serviço Alpha',
          location: {
            region_code: 'BR-SP',
            country: 'Brasil',
            region: 'São Paulo',
            city: 'Jacareí',
            latitude: -23.3053,
            longitude: -45.9658,
          },
          metrics_path: '/metrics/alpha',
        },
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => externalPayload,
      });

      repository.upsertMany.mockResolvedValue([
        { id: 'srv-1', name: 'Serviço Alpha', regionCode: 'BR-SP', status: 'registered' },
      ]);

      const result = await service.findAllServices();

      expect(result).toEqual([
        {
          id: 'srv-1',
          name: 'Serviço Alpha',
          status: 'registered',
          regionCode: 'BR-SP',
          location: {
            country: 'Brasil',
            region: 'São Paulo',
            city: 'Jacareí',
            latitude: -23.3053,
            longitude: -45.9658,
          },
          metricsPath: '/metrics/alpha',
        },
      ]);

      expect(repository.upsertMany).toHaveBeenCalledWith([
        {
          id: 'srv-1',
          name: 'Serviço Alpha',
          regionCode: 'BR-SP',
          status: 'registered',
        },
      ]);
      expect(repository.upsertMany).toHaveBeenCalledTimes(1);
    });

    it('deve lançar BadGatewayException se a API retornar um formato que não seja array', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ unexpected: 'format' }),
      });

      await expect(service.findAllServices()).rejects.toThrow(BadGatewayException);
      expect(repository.upsertMany).not.toHaveBeenCalled();
    });

    it('deve lançar BadGatewayException se a API retornar um serviço com campos inválidos', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [{ id: 'srv-1', name: 'Incompleto, faltando location' }],
      });

      await expect(service.findAllServices()).rejects.toThrow(BadGatewayException);
    });

    it('deve lançar GatewayTimeoutException se a requisição exceder o tempo limite', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'TimeoutError';
      fetchMock.mockRejectedValue(timeoutError);

      await expect(service.findAllServices()).rejects.toThrow(GatewayTimeoutException);
    });

    it('deve lançar ServiceUnavailableException se houver falha de rede', async () => {
      fetchMock.mockRejectedValue(new Error('Network Error'));

      await expect(service.findAllServices()).rejects.toThrow(ServiceUnavailableException);
    });

    it('deve lançar BadGatewayException se a resposta HTTP não for ok (ex: 500)', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(service.findAllServices()).rejects.toThrow(BadGatewayException);
    });

    it('deve lançar BadGatewayException se o parse do JSON falhar', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(service.findAllServices()).rejects.toThrow(BadGatewayException);
    });
  });

  describe('syncServices', () => {
    it('deve retornar total e serviços após gravar os dados no banco', async () => {
      const externalService = {
        id: 'srv-1',
        name: 'Serviço Alpha',
        location: {
          region_code: 'BR-SP',
          country: 'Brasil',
          region: 'São Paulo',
          city: null,
          latitude: -23.5,
          longitude: -46.6,
        },
      };
      fetchMock.mockResolvedValue({ ok: true, json: async () => [externalService] });
      repository.upsertMany.mockResolvedValue([
        { id: 'srv-1', name: 'Serviço Alpha', regionCode: 'BR-SP', status: 'registered' },
      ]);

      await expect(service.syncServices()).resolves.toEqual({
        total: 1,
        services: [{
          id: 'srv-1',
          name: 'Serviço Alpha',
          status: 'registered',
          regionCode: 'BR-SP',
          location: {
            country: 'Brasil',
            region: 'São Paulo',
            city: null,
            latitude: -23.5,
            longitude: -46.6,
          },
          metricsPath: null,
        }],
      });
      expect(repository.upsertMany).toHaveBeenCalledWith([
        { id: 'srv-1', name: 'Serviço Alpha', regionCode: 'BR-SP', status: 'registered' },
      ]);
    });

    it('aceita lista vazia sem chamar o repositório', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => [] });

      await expect(service.syncServices()).resolves.toEqual({ total: 0, services: [] });
      expect(repository.upsertMany).not.toHaveBeenCalled();
    });

    it('não grava nenhum serviço quando um item da resposta é inválido', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [{ id: 'srv-1', name: 'Incompleto' }],
      });

      await expect(service.syncServices()).rejects.toThrow(BadGatewayException);
      expect(repository.upsertMany).not.toHaveBeenCalled();
    });

    it('aguarda o upsert e propaga falhas ao salvar', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [{
          id: 'srv-1',
          name: 'Serviço Alpha',
          location: { region_code: 'BR-SP', country: 'Brasil', region: 'São Paulo' },
        }],
      });
      repository.upsertMany.mockRejectedValue(new Error('database unavailable'));

      await expect(service.syncServices()).rejects.toThrow('database unavailable');
    });
  });

  describe('findById', () => {
    it('deve retornar um serviço se ele existir', async () => {
      const mockDbService = {
        id: 'srv-1',
        name: 'Serviço Alpha',
        regionCode: 'BR-SP',
        status: 'registered',
      };

      repository.findById.mockResolvedValue(mockDbService);

      const result = await service.findById('srv-1');

      expect(result).toEqual(mockDbService);
      expect(repository.findById).toHaveBeenCalledWith('srv-1');
      expect(repository.findById).toHaveBeenCalledTimes(1);
    });

    it('deve lançar NotFoundException se o serviço não existir', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('srv-1')).rejects.toThrow(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith('srv-1');
    });
  });
});
