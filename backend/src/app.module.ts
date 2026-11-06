import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { ServicesModule } from './modules/services/services.module';
import { RegionsModule } from './modules/regions/regions.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { StartupSyncService } from './startup-sync.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [DatabaseModule, ServicesModule, RegionsModule, CollectionsModule, ScheduleModule.forRoot(), UsersModule, AuthModule],
  controllers: [AppController],
  providers: [ StartupSyncService],
})
export class AppModule {}