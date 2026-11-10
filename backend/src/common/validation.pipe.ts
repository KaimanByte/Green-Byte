import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';

/** Junta as mensagens de todos os campos inválidos (inclusive de objetos aninhados). */
function collectMessages(errors: ValidationError[], parent = ''): string[] {
  return errors.flatMap((error) => {
    const path = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.entries(error.constraints ?? {}).map(([rule, message]) =>
      // a mensagem padrão do whitelist vem em inglês ("property x should not exist")
      rule === 'whitelistValidation' ? `O campo "${path}" não é permitido.` : message,
    );
    return [...own, ...collectMessages(error.children ?? [], path)];
  });
}

/**
 * Validação global dos corpos de requisição (DTOs com class-validator).
 *
 * - `whitelist`: só os campos declarados no DTO chegam ao controller;
 * - `forbidNonWhitelisted`: um campo a mais vira 400, em vez de ser ignorado em silêncio
 *   (evita, por exemplo, mandar `id` ou outra coluna no cadastro de usuário).
 *
 * Parâmetros de rota e de query tipados como `string` não passam por aqui: o Nest
 * só valida classes. Essas entradas continuam validadas nos services (datas, limit, ids…).
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) =>
      new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: collectMessages(errors),
      }),
  });
}
