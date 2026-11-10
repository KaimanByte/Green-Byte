/**
 * Variável de ambiente obrigatória, lida de `process.env[name]` (sem espaços nas pontas).
 *
 * Segredos e credenciais (JWT_SECRET, ADM_EMAIL, ADM_PASSWORD) ficam só no .env: se a
 * variável faltar, o backend não sobe, em vez de usar um valor padrão escrito no código
 * (que qualquer pessoa com acesso ao repositório conheceria).
 */
export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não configurada. Defina-a no .env (veja o .env.example).`,
    );
  }
  return value;
}
