import { Injectable } from '@nestjs/common';
import { and, asc, eq, ne, notInArray, sql } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { regions } from '../regions/regions.schema';
import { services, Service, NewService, CollectionState } from './services.schema';

/** Como foi a tentativa de coleta de um serviço num ciclo. */
export type CollectionResult = {
  serviceId: string;
  state: CollectionState;
  attemptedAt: Date;
  /** motivo da falha; null quando coletou */
  error: string | null;
};

/** Status de quem saiu da API de métricas: continua no banco por causa do histórico de coletas. */
export const REMOVED_SERVICE_STATUS = 'removed';

/** Serviço com a localização da sua região (a tabela de serviços guarda só o código da região). */
export type ServiceWithLocation = Service & {
  country: string | null;
  regionName: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

@Injectable()
export class ServicesRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll(): Promise<Service[]> {
    return this.dbService.db.select().from(services);
  }

  /** Serviços ainda presentes na API de métricas, com a localização da região, em ordem de nome. */
  async findActiveWithLocation(): Promise<ServiceWithLocation[]> {
    return this.dbService.db
      .select({
        id: services.id,
        name: services.name,
        regionCode: services.regionCode,
        status: services.status,
        lastCollectionState: services.lastCollectionState,
        lastCollectionAttemptAt: services.lastCollectionAttemptAt,
        lastCollectionError: services.lastCollectionError,
        country: regions.country,
        regionName: regions.regionName,
        city: regions.city,
        latitude: regions.latitude,
        longitude: regions.longitude,
      })
      .from(services)
      .leftJoin(regions, eq(services.regionCode, regions.regionCode))
      .where(ne(services.status, REMOVED_SERVICE_STATUS))
      .orderBy(asc(services.name));
  }

  /** Grava o resultado da tentativa de coleta de cada serviço no ciclo. */
  async recordCollectionResults(results: CollectionResult[]): Promise<void> {
    if (results.length === 0) return;

    await this.dbService.db.transaction(async (tx) => {
      for (const result of results) {
        await tx
          .update(services)
          .set({
            lastCollectionState: result.state,
            lastCollectionAttemptAt: result.attemptedAt,
            lastCollectionError: result.error ? result.error.slice(0, 500) : null,
          })
          .where(eq(services.id, result.serviceId));
      }
    });
  }

  /**
   * Marca como removidos os serviços que não vieram na última lista da API de métricas.
   * Não apaga: as coletas antigas desses serviços continuam no histórico.
   */
  async markRemovedExcept(ids: string[]): Promise<Service[]> {
    if (ids.length === 0) return [];

    return this.dbService.db
      .update(services)
      .set({ status: REMOVED_SERVICE_STATUS })
      .where(and(notInArray(services.id, ids), ne(services.status, REMOVED_SERVICE_STATUS)))
      .returning();
  }

  async findById(id: string): Promise<Service | null> {
    const result = await this.dbService.db
      .select()
      .from(services)
      .where(eq(services.id, id));

    return result[0] || null;
  }

  async upsertMany(data: NewService[]): Promise<Service[]> {
    if (data.length === 0) return [];

    return this.dbService.db
      .insert(services)
      .values(data)
      .onConflictDoUpdate({
        target: services.id,
        set: {
          name: sql`EXCLUDED.name`,
          regionCode: sql`EXCLUDED.region_code`,
          status: sql`EXCLUDED.status`,
        },
      })
      .returning();
  }
}