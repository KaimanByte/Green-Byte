import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// 1. Importar todos os esquemas modulares
import * as usersSchema from '../modules/users/users.schema';
import * as regioesSchema from '../modules/regioes/regioes.schema';
import * as servicosSchema from '../modules/servicos/servicos.schema';
import * as coletasSchema from '../modules/coletas/coletas.schema';
import * as configuracoesSchema from '../modules/configuracoes/configuracoes.schema';

// 2. Combinar tudo num único objeto
const schema = {
  ...usersSchema,
  ...regioesSchema,
  ...servicosSchema,
  ...coletasSchema,
  ...configuracoesSchema,
};

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

export const databaseProvider = {
  provide: DATABASE_CONNECTION,
  useFactory: async () => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // 3. Passar o schema combinado para o Drizzle
    return drizzle(pool, { schema });
  },
};