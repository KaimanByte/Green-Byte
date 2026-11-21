import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { createValidationPipe } from './common/validation.pipe';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { ServicesModule } from './modules/services/services.module';
import { RegionsModule } from './modules/regions/regions.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { StartupSyncService } from './startup-sync.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { SettingsModule } from './modules/settings/settings.module';
import { MonitoringController, PublicMonitoringController } from './modules/monitoring/monitoring.controller';

@Module({
  imports: [DatabaseModule, ServicesModule, RegionsModule, CollectionsModule, ScheduleModule.forRoot(), UsersModule, AuthModule, AuditModule, SettingsModule],
  controllers: [AppController, MonitoringController, PublicMonitoringController],
  providers: [
    StartupSyncService,
    // valida todo corpo de requisição contra o DTO (class-validator) antes do controller
    { provide: APP_PIPE, useFactory: createValidationPipe },
  ],
})
export class AppModule {}
