import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ServicesModule } from './modules/services/services.module';

@Module({
  imports: [DatabaseModule, ServicesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}