import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { StartupSyncService } from '../../startup-sync.service';
import { AuditModule } from '../audit/audit.module';
import { CollectionsModule } from '../collections/collections.module';
import { RegionsModule } from '../regions/regions.module';
import { ServicesModule } from '../services/services.module';
import { SettingsController } from './settings.controller';
import { SettingsRepository } from './settings.repository';
import { SettingsService } from './settings.service';

@Module({
  imports: [DatabaseModule, RegionsModule, ServicesModule, CollectionsModule, AuditModule],
  controllers: [SettingsController],
  providers: [SettingsRepository, SettingsService, StartupSyncService],
  exports: [SettingsRepository, SettingsService, StartupSyncService],
})
export class SettingsModule {}
