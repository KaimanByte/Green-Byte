import { Test, TestingModule } from '@nestjs/testing';
import { CollectionsService } from './collections.service';
import { CollectionsRepository } from './collections.repository';
import { ServicesService } from '../services/services.service';
import { RegionsService } from '../regions/regions.service';

// Faz o mock global da API nativa 'fetch' utilizada pelo node
global.fetch = jest.fn();

describe('CollectionsService', () => {
  let service: CollectionsService;
  let collectionsRepository: jest.Mocked<CollectionsRepository>;
  let servicesService: jest.Mocked<ServicesService>;
  let regionsService: jest.Mocked<RegionsService>;

  beforeEach(async () => {
    // Cria os mocks para as dependências injetadas
    const mockCollectionsRepository = {
      findByServiceId: jest.fn(),
      getEmissionsByRegion: jest.fn(),
      getEmissionsByService: jest.fn(),
      insertMany: jest.fn(),
    };

    const mockServicesService = {
      findAllServices: jest.fn(),
    };

    const mockRegionsService = {
      findRegionByCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        { provide: CollectionsRepository, useValue: mockCollectionsRepository },
        { provide: ServicesService, useValue: mockServicesService },
        { provide: RegionsService, useValue: mockRegionsService },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
    collectionsRepository = module.get(CollectionsRepository);
    servicesService = module.get(ServicesService);
    regionsService = module.get(RegionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncCollections', () => {
    it('deve calcular a energia e emissões exatas usando o modelo de constantes', async () => {
      // 1. Simula os serviços cadastrados no banco
      servicesService.findAllServices.mockResolvedValue([
        { id: 'svc-123', regionCode: 'sa-east-1', name: 'App Backend', status: 'ACTIVE' },
      ]);

      // 2. Simula a intensidade de carbono da região retornado pelo serviço
      regionsService.findRegionByCode.mockResolvedValue({
        id: 'reg-1',
        code: 'sa-east-1',
        name: 'South America',
        carbonIntensity: 85,
      });

      // 3. Simula a resposta da API externa de métricas com os dados do exemplo
      const mockMetricsPayload = {
        collection_interval_seconds: 60,
        metrics: {
          cpu_percent: 50,  // 50% de 100W = 50W
          memory_gb: 2,     // 2 * 0.375W = 0.75W
          disk_gb: 10,      // 10 * 0.01W = 0.1W
          network_gb: 1,    // 1 * 0.02W = 0.02W
                            // TOTAL = 50.87W
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMetricsPayload,
      });

      // 4. Simula o retorno do salvamento
      collectionsRepository.insertMany.mockImplementation(async (data) => data as any);

      // Executa o método
      const result = await service.syncCollections();

      // Verifica se o fetch foi chamado para o serviço correto
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/metrics/svc-123'),
        expect.any(Object)
      );

      // Verifica a precisão do cálculo interceptando o que foi enviado pro Repositório
      expect(collectionsRepository.insertMany).toHaveBeenCalledTimes(1);
      
      const insertedData = collectionsRepository.insertMany.mock.calls[0][0][0];

      expect(insertedData.serviceId).toBe('svc-123');
      expect(insertedData.cpuPercent).toBe(50);
      
      // Avaliação tolerante por conta das dízimas da divisão (3600 e 1000)
      expect(insertedData.energyKwh).toBeCloseTo(0.0008478333, 10);
      expect(insertedData.co2Emissions).toBeCloseTo(0.0720658, 7);
    });

    it('deve retornar zero coleções e não dar throw caso nenhum serviço exista', async () => {
      servicesService.findAllServices.mockResolvedValue([]);

      const result = await service.syncCollections();

      expect(result.total).toBe(0);
      expect(collectionsRepository.insertMany).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});