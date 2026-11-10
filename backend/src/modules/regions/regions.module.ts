import { Module } from '@nestjs/common';
import { RegionsController } from './regions.controller';
import { RegionsRepository } from './regions.repository';
import { RegionsService } from './regions.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  controllers: [RegionsController],
  providers: [RegionsService, RegionsRepository],
  exports: [RegionsService, RegionsRepository],
})
export class RegionsModule {}
