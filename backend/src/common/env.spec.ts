import { afterEach, describe, expect, it } from '@jest/globals';
import { requireEnv } from './env';

describe('requireEnv', () => {
  afterEach(() => {
    delete process.env.TEST_REQUIRED_VAR;
  });

  it('devolve o valor sem espaços nas pontas', () => {
    process.env.TEST_REQUIRED_VAR = '  valor-secreto  ';
    expect(requireEnv('TEST_REQUIRED_VAR')).toBe('valor-secreto');
  });

  it('falha com mensagem clara quando a variável não existe', () => {
    expect(() => requireEnv('TEST_REQUIRED_VAR')).toThrow(/TEST_REQUIRED_VAR não configurada/);
  });

  it('falha quando a variável está vazia ou só com espaços', () => {
    process.env.TEST_REQUIRED_VAR = '   ';
    expect(() => requireEnv('TEST_REQUIRED_VAR')).toThrow(/TEST_REQUIRED_VAR não configurada/);
  });
});
