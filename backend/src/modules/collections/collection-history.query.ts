/**
 * Filtro tipado para consulta de histórico de coletas (DB-04).
 * Os limites `from` e `to` são inclusivos e opcionais.
 */
export interface CollectionHistoryQuery {
  serviceId: string;
  from?: Date;
  to?: Date;
  /** Quando informado, retorna as N coletas mais recentes do filtro (em ordem cronológica). */
  limit?: number;
}

