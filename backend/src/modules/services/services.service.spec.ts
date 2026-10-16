import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';

describe('ServicesService', () => {
  let service: ServicesService;
  let repository: jest.Mocked<ServicesRepository>;

  const mockService = {
    id: 'billing-api',
    name: 'Billing API',
    regionCode: 'br-sudeste',
    status: 'active',
  };

  beforeEach(async () => {
    // Configuração do módulo de teste com Mock do Repositório
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: ServicesRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            upsertMany: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    repository = module.get(ServicesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of services', async () => {
      repository.findAll.mockResolvedValue([mockService]);
      const result = await service.findAll();
      
      expect(result).toEqual([mockService]);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return a service if it exists', async () => {
      repository.findById.mockResolvedValue(mockService);
      const result = await service.findById('billing-api');
      
      expect(result).toEqual(mockService);
      expect(repository.findById).toHaveBeenCalledWith('billing-api');
    });

    it('should throw NotFoundException if service does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      
      await expect(service.findById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findById).toHaveBeenCalledWith('invalid-id');
    });
  });

  describe('syncExternalServices', () => {
    it('should map the external payload correctly and call upsertMany', async () => {
      const externalPayload = [
        {
          id: 'billing-api',
          name: 'Billing API',
          location: {
            region_code: 'br-sudeste',
            country: 'Brazil',
            region: 'Sudeste',
            city: 'Sao Paulo',
            latitude: -23.5505,
            longitude: -46.6333,
          },
          metrics_path: '/metrics/billing-api',
        }
      ];

      repository.upsertMany.mockResolvedValue([mockService]);

      const result = await service.syncExternalServices(externalPayload as any);

      expect(result).toEqual([mockService]);
      expect(repository.upsertMany).toHaveBeenCalledWith([
        {
          id: 'billing-api',
          name: 'Billing API',
          regionCode: 'br-sudeste',
          status: 'active',
        }
      ]);
    });
  });
});