import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ServicesModule } from './modules/services/services.module';
import { RegionsModule } from './modules/regions/regions.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { StartupSyncService } from './startup-sync.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [DatabaseModule, ServicesModule, RegionsModule, CollectionsModule, ScheduleModule.forRoot(), UsersModule],
  controllers: [AppController],
  providers: [AppService, StartupSyncService],
})
export class AppModule {}