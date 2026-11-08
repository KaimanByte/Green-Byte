import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CollectionsService } from './collections.service';
import { CollectionsRepository } from './collections.repository';
import { Collection } from './collections.schema';
import { ServicesService } from '../services/services.service';
import { RegionsService } from '../regions/regions.service';
import { ExternalHttpClient } from '../integrations/external-http.client';
import { MetricsApiClient } from '../integrations/metrics-api.client';
import { EnergyCalculator } from './energy.calculator';

// Faz o mock global da API nativa 'fetch' utilizada pelo node
const fetchMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
global.fetch = fetchMock as unknown as typeof fetch;

describe('CollectionsService', () => {
  let service: CollectionsService;
  let collectionsRepository: jest.Mocked<CollectionsRepository>;
  let servicesService: jest.Mocked<ServicesService>;
  let regionsService: jest.Mocked<RegionsService>;

  beforeEach(async () => {
    process.env.METRICS_API_BASE_URL = 'https://metrics.test';
    // Cria os mocks para as dependências injetadas
    const mockCollectionsRepository = {
      findByServiceId: jest.fn(),
      findHistory: jest.fn(),
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
        ExternalHttpClient,
        MetricsApiClient,
        EnergyCalculator,
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
    delete process.env.METRICS_API_BASE_URL;
    jest.clearAllMocks();
  });

  describe('syncCollections', () => {
    it('deve calcular a energia e emissões exatas usando o modelo de constantes', async () => {
      // 1. Simula os serviços cadastrados no banco
      (servicesService.findAllServices as jest.Mock<() => Promise<unknown>>).mockResolvedValue([
        { id: 'svc-123', regionCode: 'sa-east-1', name: 'App Backend', status: 'ACTIVE' },
      ]);

      // 2. Simula a intensidade de carbono da região retornado pelo serviço
      (regionsService.findRegionByCode as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
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

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockMetricsPayload,
      });

      // 4. Simula o retorno do salvamento
      collectionsRepository.insertMany.mockImplementation(async (data) => data as Collection[]);

      // Executa o método
      const result = await service.syncCollections();

      // Verifica se o fetch foi chamado para o serviço correto
      expect(fetchMock).toHaveBeenCalledWith(
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
      expect(Number.isFinite(insertedData.co2Emissions)).toBe(true);
      expect(result.total).toBe(1);
    });

    it('uma falha em um serviço não impede a coleta dos outros', async () => {
      (servicesService.findAllServices as jest.Mock<() => Promise<unknown>>).mockResolvedValue([
        { id: 'svc-ok', regionCode: 'us-east' },
        { id: 'svc-down', regionCode: 'us-east' },
      ]);
      (regionsService.findRegionByCode as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
        regionCode: 'us-east',
        carbonIntensity: 380,
      });
      fetchMock.mockImplementation(async (url) =>
        String(url).endsWith('/metrics/svc-down')
          ? { ok: false, status: 500, json: async () => ({}) }
          : {
              ok: true,
              json: async () => ({
                collection_interval_seconds: 3600,
                metrics: { cpu_percent: 100, memory_gb: 0, disk_gb: 0, network_gb: 0 },
              }),
            },
      );
      collectionsRepository.insertMany.mockImplementation(async (data) => data as Collection[]);

      const result = await service.syncCollections();

      // só o serviço que respondeu é gravado: 100 W por 1 h = 0,1 kWh; × 380 = 38 gCO₂e
      expect(result.total).toBe(1);
      const [saved] = collectionsRepository.insertMany.mock.calls[0][0];
      expect(saved.serviceId).toBe('svc-ok');
      expect(saved.energyKwh).toBeCloseTo(0.1, 12);
      expect(saved.co2Emissions).toBeCloseTo(38, 9);
    });

    it('deve retornar zero coleções e não dar throw caso nenhum serviço exista', async () => {
      (servicesService.findAllServices as jest.Mock<() => Promise<unknown>>).mockResolvedValue([]);

      const result = await service.syncCollections();

      expect(result.total).toBe(0);
      expect(collectionsRepository.insertMany).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('findHistory', () => {
    const serviceId = 'svc-1';

    it('deve delegar ao repositório o filtro por serviço e intervalo', async () => {
      const from = new Date('2026-10-01T00:00:00.000Z');
      const to = new Date('2026-10-31T23:59:59.999Z');
      const rows = [{ id: 1, serviceId, timestamp: from }] as never;
      collectionsRepository.findHistory.mockResolvedValue(rows);

      const result = await service.findHistory({ serviceId, from, to });

      expect(collectionsRepository.findHistory).toHaveBeenCalledWith({ serviceId, from, to });
      expect(result).toBe(rows);
    });

    it('deve aceitar intervalo omitido (histórico completo)', async () => {
      collectionsRepository.findHistory.mockResolvedValue([]);

      await service.findHistory({ serviceId });

      expect(collectionsRepository.findHistory).toHaveBeenCalledWith({ serviceId });
    });

    it('deve aceitar from igual a to (limites inclusivos)', async () => {
      const instant = new Date('2026-10-10T12:00:00.000Z');
      collectionsRepository.findHistory.mockResolvedValue([]);

      await expect(service.findHistory({ serviceId, from: instant, to: instant })).resolves.toEqual([]);
    });

    it('deve retornar lista vazia para período sem coletas', async () => {
      collectionsRepository.findHistory.mockResolvedValue([]);

      const result = await service.findHistory({
        serviceId,
        from: new Date('2020-01-01T00:00:00.000Z'),
        to: new Date('2020-01-02T00:00:00.000Z'),
      });

      expect(result).toEqual([]);
    });

    it('deve rejeitar from posterior a to', async () => {
      await expect(
        service.findHistory({
          serviceId,
          from: new Date('2026-10-02T00:00:00.000Z'),
          to: new Date('2026-10-01T00:00:00.000Z'),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(collectionsRepository.findHistory).not.toHaveBeenCalled();
    });

    it('deve rejeitar datas inválidas e limit inválido', async () => {
      await expect(service.findHistory({ serviceId, from: new Date('x') })).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.findHistory({ serviceId, to: new Date('x') })).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.findHistory({ serviceId, limit: 0 })).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.findHistory({ serviceId, limit: Number.NaN })).rejects.toBeInstanceOf(BadRequestException);
      expect(collectionsRepository.findHistory).not.toHaveBeenCalled();
    });
  });});
