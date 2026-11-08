import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { CollectionsRepository } from './collections.repository';
import { CollectionTimeSeriesController } from './collection-timeseries.controller';
import { CollectionTimeSeriesService } from './collection-timeseries.service';
import { EnvironmentIndicatorsCalculator } from './environment-indicators.calculator';
import { EnvironmentIndicatorsService } from './environment-indicators.service';
import { ServiceHistoryController } from './service-history.controller';
import { ServiceHistoryService } from './service-history.service';
import { SummaryController } from './summary.controller';
import { RankingCompareCalculator } from './ranking-compare.calculator';
import { RankingCompareController } from './ranking-compare.controller';
import { RankingCompareService } from './ranking-compare.service';
import { ServicesModule } from '../services/services.module';
import { RegionsModule } from '../regions/regions.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { EnergyCalculator } from './energy.calculator';

@Module({
  imports: [DatabaseModule, ServicesModule, RegionsModule, IntegrationsModule],
  controllers: [
    CollectionsController,
    ServiceHistoryController,
    SummaryController,
    RankingCompareController,
    CollectionTimeSeriesController,
  ],
  providers: [
    CollectionsService,
    CollectionsRepository,
    EnergyCalculator,
    EnvironmentIndicatorsCalculator,
    EnvironmentIndicatorsService,
    ServiceHistoryService,
    RankingCompareCalculator,
    RankingCompareService,
    CollectionTimeSeriesService,
  ],
  exports: [CollectionsService, EnvironmentIndicatorsService, RankingCompareService],
})
export class CollectionsModule {}
