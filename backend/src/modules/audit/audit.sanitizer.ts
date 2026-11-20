import { Injectable } from '@nestjs/common';

const SENSITIVE_TERMS = ['password', 'senha', 'token', 'secret', 'authorization'] as const;

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[_-]/g, '');
  return SENSITIVE_TERMS.some((term) => normalized.includes(term));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

function sanitizeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }
  if (isPlainObject(value)) {
    const clean: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (isSensitiveKey(key) || nested === undefined) {
        continue;
      }
      clean[key] = sanitizeValue(nested);
    }
    return clean;
  }
  return value;
}

/**
 * Remove recursivamente campos sensíveis (senhas, hashes, tokens, segredos, authorization)
 * de qualquer payload antes de gravar ou devolver registros de auditoria (AU-07).
 * Função pura: nunca altera o objeto original.
 */
export function sanitizeAuditPayload(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (isPlainObject(value)) {
    return sanitizeValue(value) as Record<string, unknown>;
  }
  return { value: sanitizeValue(value) };
}

@Injectable()
export class AuditSanitizer {
  sanitize(value: unknown): Record<string, unknown> | null {
    return sanitizeAuditPayload(value);
  }
}
