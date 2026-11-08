import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

/** Mensagens devolvidas ao cliente para cada tipo de falha de uma API externa. */
export interface ExternalRequestMessages {
  /** A API não respondeu dentro do tempo limite (504). */
  timeout: string;
  /** Não foi possível conectar à API (503). */
  unavailable: string;
  /** A API respondeu com status de erro (502). */
  httpError: (status: number) => string;
  /** A API respondeu 2xx, mas o corpo não é JSON válido (502). */
  invalidJson: string;
}

export interface ExternalGetOptions {
  messages: ExternalRequestMessages;
  timeoutMs?: number;
}

export const DEFAULT_EXTERNAL_TIMEOUT_MS = 5_000;

/**
 * URL base de uma API externa, lida da variável de ambiente `name` (sem barras finais).
 * As URLs ficam só no .env: se a variável faltar, o backend não sobe, em vez de
 * chamar um endereço escondido no código.
 */
export function requireBaseUrl(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não configurada. Defina a URL da API externa no .env (veja o .env.example).`,
    );
  }
  return value.replace(/\/+$/, '');
}

/**
 * Cliente HTTP genérico para as APIs externas (GreenER métricas e carbono).
 *
 * Concentra o que antes estava repetido em cada service: GET com Accept JSON,
 * tempo limite e a tradução das falhas em exceções HTTP do Nest
 * (timeout → 504, sem conexão → 503, HTTP de erro ou JSON inválido → 502).
 * Não conhece o formato dos dados: quem valida o conteúdo são os clientes específicos.
 */
@Injectable()
export class ExternalHttpClient {
  private readonly logger = new Logger(ExternalHttpClient.name);

  async getJson(
    url: string,
    { messages, timeoutMs = DEFAULT_EXTERNAL_TIMEOUT_MS }: ExternalGetOptions,
  ): Promise<unknown> {
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error: unknown) {
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw new GatewayTimeoutException(messages.timeout);
      }
      this.logger.error(messages.unavailable, error instanceof Error ? error.stack : undefined);
      throw new ServiceUnavailableException(messages.unavailable);
    }

    if (!response.ok) {
      this.logger.warn(`GET ${url} respondeu com HTTP ${response.status}.`);
      throw new BadGatewayException(messages.httpError(response.status));
    }

    try {
      return await response.json();
    } catch {
      throw new BadGatewayException(messages.invalidJson);
    }
  }
}
