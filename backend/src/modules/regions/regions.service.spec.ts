import {
  BadGatewayException,
  GatewayTimeoutException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RegionsRepository } from './regions.repository';
import { RegionsService } from './regions.service';
import { NewRegion, Region } from './regions.schema';

describe('RegionsService', () => {
  const originalFetch = global.fetch;
  let service: RegionsService;
  let fetchMock: jest.Mock;
  let repository: {
    findAll: jest.Mock;
    findByCode: jest.Mock;
    upsertMany: jest.Mock;
  };

  const sudeste: Region = {
    regionCode: 'br-sudeste',
    country: 'Brazil',
    regionName: 'Sudeste',
    city: 'Sao Paulo',
    latitude: -23.5505,
    longitude: -46.6333,
    carbonIntensity: 85,
    renewableSharePercent: 83,
  };

  const externalSudeste = {
    code: 'br-sudeste',
    country: 'Brazil',
    region: 'Sudeste',
    city: 'Sao Paulo',
    latitude: -23.5505,
    longitude: -46.6333,
    carbon_intensity_gco2e_per_kwh: 85,
    renewable_share_percent: 83,
  };

  const externalUsEast = {
    code: 'us-east',
    country: 'United States',
    region: 'Virginia',
    city: null,
    latitude: 38.9,
    longitude: -77.4,
    carbon_intensity_gco2e_per_kwh: 380,
    renewable_share_percent: 21,
  };

  beforeEach(() => {
    process.env.CARBON_API_BASE_URL = 'https://carbon.unilaunch.org/';
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    repository = {
      findAll: jest.fn(),
      findByCode: jest.fn(),
      // Mock atualizado para upsertMany
      upsertMany: jest.fn(async (data: NewRegion[]) => data),
    };
    service = new RegionsService(repository as unknown as RegionsRepository);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.CARBON_API_BASE_URL;
    jest.clearAllMocks();
  });

  describe('findAllRegions', () => {
    it('converte as regiões do banco para o DTO de resposta', async () => {
      repository.findAll.mockResolvedValue([
        sudeste,
        { ...sudeste, regionCode: 'us-east', city: null },
      ]);

      await expect(service.findAllRegions()).resolves.toEqual([
        {
          codigoRegiao: 'br-sudeste',
          pais: 'Brazil',
          regiao: 'Sudeste',
          cidade: 'Sao Paulo',
          latitude: -23.5505,
          longitude: -46.6333,
          intensidadeCarbono: 85,
          percentualRenovavel: 83,
        },
        expect.objectContaining({ codigoRegiao: 'us-east', cidade: null }),
      ]);
    });

    it('retorna lista vazia quando não há regiões gravadas', async () => {
      repository.findAll.mockResolvedValue([]);

      await expect(service.findAllRegions()).resolves.toEqual([]);
    });
  });

  describe('findRegionByCode', () => {
    it('retorna a região encontrada', async () => {
      repository.findByCode.mockResolvedValue(sudeste);

      await expect(service.findRegionByCode('br-sudeste')).resolves.toEqual(
        expect.objectContaining({
          codigoRegiao: 'br-sudeste',
          intensidadeCarbono: 85,
        }),
      );
      expect(repository.findByCode).toHaveBeenCalledWith('br-sudeste');
    });

    it('lança NotFound quando a região não existe', async () => {
      repository.findByCode.mockResolvedValue(null);

      await expect(service.findRegionByCode('unknown')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('syncRegions', () => {
    it('consulta a API externa e grava todas as regiões com upsertMany', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          regions: [externalSudeste, externalUsEast],
          total: 2,
        }),
      });

      const result = await service.syncRegions();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://carbon.unilaunch.org/regions',
        expect.objectContaining({ method: 'GET' }),
      );
      
      // Valida se o upsertMany foi chamado 1 vez com o array completo
      expect(repository.upsertMany).toHaveBeenCalledTimes(1);
      expect(repository.upsertMany).toHaveBeenCalledWith([
        sudeste,
        expect.objectContaining({
          regionCode: 'us-east',
          regionName: 'Virginia',
          city: null,
          carbonIntensity: 380,
          renewableSharePercent: 21,
        }),
      ]);

      expect(result.total).toBe(2);
      expect(result.regioes[0]).toEqual({
        codigoRegiao: 'br-sudeste',
        pais: 'Brazil',
        regiao: 'Sudeste',
        cidade: 'Sao Paulo',
        latitude: -23.5505,
        longitude: -46.6333,
        intensidadeCarbono: 85,
        percentualRenovavel: 83,
      });
    });

    it('converte erros HTTP da API externa em Bad Gateway', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500 });

      await expect(service.syncRegions()).rejects.toBeInstanceOf(
        BadGatewayException,
      );
      expect(repository.upsertMany).not.toHaveBeenCalled();
    });

    it('converte falhas de conexão em Service Unavailable', async () => {
      fetchMock.mockRejectedValue(new Error('network error'));

      await expect(service.syncRegions()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('converte timeout em Gateway Timeout', async () => {
      const timeout = new Error('timeout');
      timeout.name = 'TimeoutError';
      fetchMock.mockRejectedValue(timeout);

      await expect(service.syncRegions()).rejects.toBeInstanceOf(
        GatewayTimeoutException,
      );
    });

    it('rejeita JSON inválido', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      await expect(service.syncRegions()).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('rejeita resposta sem a lista "regions"', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [externalSudeste],
      });

      await expect(service.syncRegions()).rejects.toBeInstanceOf(
        BadGatewayException,
      );
      expect(repository.upsertMany).not.toHaveBeenCalled();
    });

    it.each([
      ['sem código', { ...externalSudeste, code: undefined }],
      ['latitude fora da faixa', { ...externalSudeste, latitude: 123 }],
      [
        'intensidade negativa',
        { ...externalSudeste, carbon_intensity_gco2e_per_kwh: -1 },
      ],
      [
        'percentual renovável acima de 100',
        { ...externalSudeste, renewable_share_percent: 101 },
      ],
      [
        'intensidade como texto',
        { ...externalSudeste, carbon_intensity_gco2e_per_kwh: '85' },
      ],
    ])(
      'não grava nada quando uma região é inválida (%s)',
      async (_descricao: string, regiaoInvalida: unknown) => {
        fetchMock.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            regions: [externalUsEast, regiaoInvalida],
            total: 2,
          }),
        });

        await expect(service.syncRegions()).rejects.toBeInstanceOf(
          BadGatewayException,
        );
        expect(repository.upsertMany).not.toHaveBeenCalled();
      },
    );

    it('aceita lista vazia sem gravar nada', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ regions: [], total: 0 }),
      });

      await expect(service.syncRegions()).resolves.toEqual({
        total: 0,
        regioes: [],
      });
      expect(repository.upsertMany).not.toHaveBeenCalled();
    });
  });
});