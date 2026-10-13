import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/database.provider';
import { servicos } from './servicos.schema';
import { regioes } from '../regioes/regioes.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class ServicosService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async findAllServices() {
    const resultado = await this.db
      .select({
        id: servicos.id,
        nome: servicos.nome,
        status: servicos.status,
        codigoRegiao: regioes.codigoRegiao,
        pais: regioes.pais,
        regiao: regioes.nomeRegiao,
        cidade: regioes.cidade,
      })
      .from(servicos)
      .leftJoin(regioes, eq(servicos.codigoRegiao, regioes.codigoRegiao));

    // Mapeia o resultado do BD para o DTO
    return resultado.map((item: any) => ({
      id: item.id,
      nome: item.nome,
      status: item.status,
      localizacao: {
        codigoRegiao: item.codigoRegiao || 'unknown',
        pais: item.pais || 'Desconhecido',
        regiao: item.regiao || 'Desconhecida',
        cidade: item.cidade || null,
      }
    }));
  }
}