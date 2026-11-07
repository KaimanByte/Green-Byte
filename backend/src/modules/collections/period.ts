import { BadRequestException } from '@nestjs/common';
import { IndicatorsPeriod } from './environment-indicators.types';

export const DEFAULT_PERIOD_MS = 24 * 60 * 60 * 1000;

const ISO_8601 =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?)?$/;

/**
 * Converte um query param ISO 8601 em Date. Ausente → undefined.
 * Formatos malformados ou datas inexistentes (ex.: 2026-02-30) → 400.
 * Data sem fuso é interpretada como UTC.
 */
export function parseDateParam(name: 'from' | 'to', value?: string): Date | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  const normalized = /T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(value) ? `${value}Z` : value;
  const date = new Date(normalized);

  if (!ISO_8601.test(value) || isNaN(date.getTime()) || !isSameCalendarDay(value, date)) {
    throw new BadRequestException(`Parâmetro "${name}" inválido: use uma data ISO 8601 (ex.: 2026-10-01T00:00:00Z).`);
  }

  return date;
}

/** Converte `limit` em inteiro positivo. Ausente → undefined; inválido → 400. */
export function parseLimitParam(value?: string): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  if (!/^\d+$/.test(value) || Number(value) <= 0) {
    throw new BadRequestException('Parâmetro "limit" deve ser um inteiro positivo.');
  }
  return Number(value);
}

/**
 * Período efetivo: sem `to` → agora; sem `from` → `to` menos 24h.
 * `from` posterior a `to` → 400.
 */
export function resolvePeriod(from?: Date, to?: Date): IndicatorsPeriod {
  if ((from && isNaN(from.getTime())) || (to && isNaN(to.getTime()))) {
    throw new BadRequestException('Datas "from" e "to" devem ser válidas (ISO 8601).');
  }

  const end = to ?? new Date();
  const start = from ?? new Date(end.getTime() - DEFAULT_PERIOD_MS);

  if (start.getTime() > end.getTime()) {
    throw new BadRequestException('"from" não pode ser posterior a "to".');
  }

  return { from: start, to: end };
}

/** Rejeita datas que o JS "corrige" silenciosamente (ex.: 2026-02-30 → 2026-03-02). */
function isSameCalendarDay(raw: string, parsed: Date): boolean {
  const [y, m, d] = raw.slice(0, 10).split('-').map(Number);
  // Compara no fuso do próprio valor quando há offset; para simplicidade valida pelo dia informado.
  const probe = new Date(Date.UTC(y, m - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d && !isNaN(parsed.getTime());
}

