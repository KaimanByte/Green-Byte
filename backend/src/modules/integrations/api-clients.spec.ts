import { jest } from '@jest/globals';
import { BadGatewayException } from '@nestjs/common';
import { CarbonApiClient } from './carbon-api.client';
import { ExternalHttpClient } from './external-http.client';
import { MetricsApiClient } from './metrics-api.client';

type GetJson = ExternalHttpClient['getJson'];

/** ExternalHttpClient falso: devolve `payload` e registra as URLs pedidas. */
function fakeHttp(payload: unknown) {
  const getJson = jest.fn<GetJson>(async () => payload);
  return { http: { getJson } as unknown as ExternalHttpClient, getJson };
}

const validService = {
  id: 'svc-1',
  name: 'Billing API',
  location: { region_code: 'us-east', country: 'US', region: 'Virginia', city: null, latitude: 38.9, longitude: -77.4 },
  metrics_path: '/metrics/svc-1',
};

const validRegion = {
  code: 'us-east',
  country: 'US',
  region: 'Virginia',
  city: null,
  latitude: 38.9,
  longitude: -77.4,
  carbon_intensity_gco2e_per_kwh: 380,
  renewable_share_percent: 21,
};

describe('MetricsApiClient', () => {
  beforeEach(() => {
    process.env.METRICS_API_BASE_URL = 'https://metrics.test';
  });

  afterEach(() => {
    delete process.env.METRICS_API_BASE_URL;
  });

  it('usa METRICS_API_BASE_URL (sem barra final) para montar as rotas', async () => {
    process.env.METRICS_API_BASE_URL = 'https://metrics.test/';
    const { http, getJson } = fakeHttp({ collection_interval_seconds: 30, metrics: {} });

    await new MetricsApiClient(http).getServiceMetrics('svc-1');

    expect(getJson.mock.calls[0][0]).toBe('https://metrics.test/metrics/svc-1');
  });

  it('não sobe sem METRICS_API_BASE_URL (sem URL fixa no código)', () => {
    delete process.env.METRICS_API_BASE_URL;
    const { http } = fakeHttp([]);

    expect(() => new MetricsApiClient(http)).toThrow(/METRICS_API_BASE_URL não configurada/);
  });

  it('devolve os serviços quando todos são válidos', async () => {
    const { http } = fakeHttp([validService]);

    await expect(new MetricsApiClient(http).listServices()).resolves.toEqual([validService]);
  });

  it('rejeita a lista inteira se um serviço vier com campos inválidos', async () => {
    const { http } = fakeHttp([validService, { ...validService, id: 42 }]);

    await expect(new MetricsApiClient(http).listServices()).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('rejeita resposta que não é uma lista', async () => {
    const { http } = fakeHttp({ services: [validService] });

    await expect(new MetricsApiClient(http).listServices()).rejects.toBeInstanceOf(BadGatewayException);
  });
});

describe('CarbonApiClient', () => {
  beforeEach(() => {
    process.env.CARBON_API_BASE_URL = 'https://carbon.test';
  });

  afterEach(() => {
    delete process.env.CARBON_API_BASE_URL;
  });

  it('usa CARBON_API_BASE_URL (sem barra final) para montar a rota', async () => {
    process.env.CARBON_API_BASE_URL = 'https://carbon.test//';
    const { http, getJson } = fakeHttp({ regions: [] });

    await new CarbonApiClient(http).listRegions();

    expect(getJson.mock.calls[0][0]).toBe('https://carbon.test/regions');
  });

  it('não sobe sem CARBON_API_BASE_URL (sem URL fixa no código)', () => {
    delete process.env.CARBON_API_BASE_URL;
    const { http } = fakeHttp({ regions: [] });

    expect(() => new CarbonApiClient(http)).toThrow(/CARBON_API_BASE_URL não configurada/);
  });

  it('devolve as regiões quando todas são válidas', async () => {
    const { http } = fakeHttp({ regions: [validRegion] });

    await expect(new CarbonApiClient(http).listRegions()).resolves.toEqual([validRegion]);
  });

  it('rejeita a lista inteira se uma região vier fora da faixa válida', async () => {
    const { http } = fakeHttp({ regions: [validRegion, { ...validRegion, renewable_share_percent: 120 }] });

    await expect(new CarbonApiClient(http).listRegions()).rejects.toBeInstanceOf(BadGatewayException);
  });
});
