import { Injectable } from '@nestjs/common';

const rotas = {
  'swagger':'/api/docs',
  'todas as regiões': 'GET /regions',
  'regiões por código da região':'GET /services/:regionCode',
  'sincronizar as regiões':'POST /regions/sync',
  'todos os services':'GET /services',
  'services por id':'GET /services/:id',
  'sincronizar os services':'POST /services/sync',
  'histórico de coletas de um serviço':'GET /collections/services/:serviceId',
  'agrupa emissões e consumo por região, num período':'GET /collections/services/region',
  'agrupa emissões e consumo por serviço, num período':'GET /collections/emissions/service',
  'sincronizar as coletas':'POST /collections/emissions/service',
}

@Injectable()
export class AppService {
  getHello(): {} {
    return rotas;
  }
}
