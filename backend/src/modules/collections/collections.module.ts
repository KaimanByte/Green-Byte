import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { CollectionsRepository } from './collections.repository';
import { EnvironmentIndicatorsCalculator } from './environment-indicators.calculator';
import { EnvironmentIndicatorsService } from './environment-indicators.service';
import { ServiceHistoryController } from './service-history.controller';
import { ServiceHistoryService } from './service-history.service';
import { SummaryController } from './summary.controller';
import { ServicesModule } from '../services/services.module';
import { RegionsModule } from '../regions/regions.module';

@Module({
  imports: [DatabaseModule, ServicesModule, RegionsModule],
  controllers: [CollectionsController, ServiceHistoryController, SummaryController],
  providers: [
    CollectionsService,
    CollectionsRepository,
    EnvironmentIndicatorsCalculator,
    EnvironmentIndicatorsService,
    ServiceHistoryService,
  ],
  exports: [CollectionsService, EnvironmentIndicatorsService],
})
export class CollectionsModule {}
