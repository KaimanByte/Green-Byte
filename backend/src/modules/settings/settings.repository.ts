import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { settings, NewSettings, Settings, UpdateSettings } from './settings.schema';

const SETTINGS_ID = 1;

@Injectable()
export class SettingsRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /**
   * Devolve a configuração; na primeira leitura cria a linha com os padrões do schema
   * mais os valores iniciais informados (ex.: intervalo vindo do .env).
   */
  async getSettings(initial: Omit<NewSettings, 'id' | 'updatedAt'> = {}): Promise<Settings> {
    const result = await this.dbService.db
      .select()
      .from(settings)
      .where(eq(settings.id, SETTINGS_ID));

    if (result[0]) {
      return result[0];
    }

    const newRecord = await this.dbService.db
      .insert(settings)
      .values({ id: SETTINGS_ID, ...initial })
      // duas leituras simultâneas no primeiro acesso: a segunda não quebra por chave duplicada
      .onConflictDoNothing()
      .returning();

    if (newRecord[0]) {
      return newRecord[0];
    }

    const existing = await this.dbService.db
      .select()
      .from(settings)
      .where(eq(settings.id, SETTINGS_ID));
    return existing[0];
  }

  async updateSettings(data: UpdateSettings): Promise<Settings> {
    const result = await this.dbService.db
      .update(settings)
      .set(data)
      .where(eq(settings.id, SETTINGS_ID))
      .returning();

    if (!result[0]) {
      const initRecord = await this.dbService.db
        .insert(settings)
        .values({ id: SETTINGS_ID, ...data })
        .returning();
        
      return initRecord[0];
    }

    return result[0];
  }
}