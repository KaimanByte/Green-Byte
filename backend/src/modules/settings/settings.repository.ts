import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { settings, Settings, UpdateSettings } from './settings.schema';

const SETTINGS_ID = 1;

@Injectable()
export class SettingsRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async getSettings(): Promise<Settings> {
    const result = await this.dbService.db
      .select()
      .from(settings)
      .where(eq(settings.id, SETTINGS_ID));

    if (result[0]) {
      return result[0];
    }

    const newRecord = await this.dbService.db
      .insert(settings)
      .values({ id: SETTINGS_ID })
      .returning();

    return newRecord[0];
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