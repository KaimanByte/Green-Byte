import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';
import { DatabaseModule } from '../../database/database.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [DatabaseModule, IntegrationsModule],
  controllers: [ServicesController],
  providers: [ServicesService, ServicesRepository],
  exports: [ServicesService, ServicesRepository],
})
export class ServicesModule {}