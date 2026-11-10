import { jest } from '@jest/globals';
import {
  BadGatewayException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ExternalHttpClient, ExternalRequestMessages, requireBaseUrl } from './external-http.client';

type AsyncFn = (...args: unknown[]) => Promise<unknown>;

const messages: ExternalRequestMessages = {
  timeout: 'demorou',
  unavailable: 'fora do ar',
  httpError: (status) => `http ${status}`,
  invalidJson: 'json ruim',
};

describe('ExternalHttpClient', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock<AsyncFn>;
  let client: ExternalHttpClient;

  beforeEach(() => {
    fetchMock = jest.fn<AsyncFn>();
    global.fetch = fetchMock as unknown as typeof fetch;
    client = new ExternalHttpClient();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('faz GET pedindo JSON, com tempo limite, e devolve o corpo', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ a: 1 }) });

    await expect(client.getJson('https://api.test/x', { messages })).resolves.toEqual({ a: 1 });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.test/x');
    expect(init.method).toBe('GET');
    expect(init.headers).toEqual({ Accept: 'application/json' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('converte timeout em 504 com a mensagem informada', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('t'), { name: 'TimeoutError' }));

    const error = await client.getJson('https://api.test/x', { messages }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GatewayTimeoutException);
    expect((error as Error).message).toBe('demorou');
  });

  it('converte falha de conexão em 503', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    jest.spyOn((client as unknown as { logger: { error: () => void } }).logger, 'error').mockImplementation(() => {});

    const error = await client.getJson('https://api.test/x', { messages }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as Error).message).toBe('fora do ar');
  });

  it('converte status de erro em 502, repassando o status para a mensagem', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    jest.spyOn((client as unknown as { logger: { warn: () => void } }).logger, 'warn').mockImplementation(() => {});

    const error = await client.getJson('https://api.test/x', { messages }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BadGatewayException);
    expect((error as Error).message).toBe('http 500');
  });

  it('converte corpo que não é JSON em 502', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    });

    const error = await client.getJson('https://api.test/x', { messages }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BadGatewayException);
    expect((error as Error).message).toBe('json ruim');
  });
});

describe('requireBaseUrl', () => {
  afterEach(() => {
    delete process.env.TEST_API_BASE_URL;
  });

  it('lê a URL da variável de ambiente, sem barras finais', () => {
    process.env.TEST_API_BASE_URL = 'https://api.test///';
    expect(requireBaseUrl('TEST_API_BASE_URL')).toBe('https://api.test');
  });

  it('falha com mensagem clara quando a variável está ausente ou vazia', () => {
    expect(() => requireBaseUrl('TEST_API_BASE_URL')).toThrow(/TEST_API_BASE_URL não configurada/);

    process.env.TEST_API_BASE_URL = '   ';
    expect(() => requireBaseUrl('TEST_API_BASE_URL')).toThrow(/TEST_API_BASE_URL não configurada/);
  });
});
