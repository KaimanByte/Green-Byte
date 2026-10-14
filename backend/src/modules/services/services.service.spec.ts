import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  const originalFetch = global.fetch;
  let service: ServicesService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.METRICS_API_BASE_URL = 'https://metrics.unilaunch.org/';
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    service = new ServicesService();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.METRICS_API_BASE_URL;
    jest.clearAllMocks();
  });

  it('consulta a API externa e normaliza serviço e localização', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
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
        },
        {
          id: 'worker-api',
          name: 'Worker API',
          location: {
            region_code: 'us-east',
            country: 'United States',
            region: 'Virginia',
            city: null,
          },
        },
      ],
    });

    await expect(service.findAllServices()).resolves.toEqual([
      {
        id: 'billing-api',
        nome: 'Billing API',
        status: 'registrado',
        localizacao: {
          codigoRegiao: 'br-sudeste',
          pais: 'Brazil',
          regiao: 'Sudeste',
          cidade: 'Sao Paulo',
        },
      },
      {
        id: 'worker-api',
        nome: 'Worker API',
        status: 'registrado',
        localizacao: {
          codigoRegiao: 'us-east',
          pais: 'United States',
          regiao: 'Virginia',
          cidade: null,
        },
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://metrics.unilaunch.org/services',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('converte erros HTTP da API externa em Bad Gateway', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    await expect(service.findAllServices()).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('converte falhas de conexão em Service Unavailable', async () => {
    fetchMock.mockRejectedValue(new Error('network error'));

    await expect(service.findAllServices()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('rejeita respostas que não sejam uma lista', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ services: [] }),
    });

    await expect(service.findAllServices()).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
