import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { createValidationPipe } from './validation.pipe';
import { LoginDto } from '../modules/auth/dto/login.dto';
import { CreateUserDto } from '../modules/users/dto/create-user.dto';
import { UpdateUserDto } from '../modules/users/dto/update-user.dto';

const pipe = createValidationPipe();
const body = (metatype: ArgumentMetadata['metatype']): ArgumentMetadata => ({ type: 'body', metatype });

/** Roda a pipe e devolve as mensagens do 400 (ou falha se não lançar). */
async function messagesFor(value: unknown, metatype: ArgumentMetadata['metatype']): Promise<string[]> {
  const error = await pipe.transform(value, body(metatype)).catch((e: unknown) => e);
  expect(error).toBeInstanceOf(BadRequestException);
  return ((error as BadRequestException).getResponse() as { message: string[] }).message;
}

describe('ValidationPipe global', () => {
  describe('LoginDto', () => {
    it('aceita e-mail e senha válidos', async () => {
      const value = { email: 'dev@empresa.com', password: 'SenhaSegura123!' };
      await expect(pipe.transform(value, body(LoginDto))).resolves.toEqual(value);
    });

    it('rejeita corpo vazio com as mensagens do DTO, em português', async () => {
      const messages = await messagesFor({}, LoginDto);

      expect(messages).toEqual(
        expect.arrayContaining(['O e-mail é obrigatório.', 'A senha é obrigatória.']),
      );
    });

    it('rejeita e-mail inválido e senha que não é texto', async () => {
      const messages = await messagesFor({ email: 'nao-e-email', password: 123 }, LoginDto);

      expect(messages).toEqual(
        expect.arrayContaining(['Informe um e-mail válido.', 'A senha deve ser um texto.']),
      );
    });

    it('rejeita campos que não existem no DTO', async () => {
      const messages = await messagesFor(
        { email: 'dev@empresa.com', password: 'x', isAdmin: true },
        LoginDto,
      );

      expect(messages).toEqual(['O campo "isAdmin" não é permitido.']);
    });
  });

  describe('CreateUserDto / UpdateUserDto', () => {
    it('exige senha com pelo menos 8 caracteres no cadastro', async () => {
      const messages = await messagesFor({ email: 'dev@empresa.com', hashPassword: 'curta' }, CreateUserDto);

      expect(messages).toEqual(['A senha precisa ter pelo menos 8 caracteres.']);
    });

    it('impede enviar colunas extras no cadastro (ex.: id)', async () => {
      const messages = await messagesFor(
        { id: 1, email: 'dev@empresa.com', hashPassword: 'SenhaSegura123!' },
        CreateUserDto,
      );

      expect(messages).toEqual(['O campo "id" não é permitido.']);
    });

    it('na atualização os campos são opcionais, mas continuam validados se enviados', async () => {
      await expect(pipe.transform({ email: 'novo@empresa.com' }, body(UpdateUserDto))).resolves.toEqual({
        email: 'novo@empresa.com',
      });

      const messages = await messagesFor({ email: 'invalido' }, UpdateUserDto);
      expect(messages).toEqual(['Informe um e-mail válido.']);
    });
  });

  it('não interfere em query e parâmetros de rota tipados como texto', async () => {
    // essas entradas continuam validadas nos services (datas, limit, ids…)
    await expect(pipe.transform('2026-11-08T00:00:00Z', { type: 'query', metatype: String, data: 'from' })).resolves.toBe(
      '2026-11-08T00:00:00Z',
    );
    await expect(pipe.transform('a,b', { type: 'query', metatype: String, data: 'ids' })).resolves.toBe('a,b');
    await expect(pipe.transform('billing-api', { type: 'param', metatype: String, data: 'id' })).resolves.toBe(
      'billing-api',
    );
  });
});
