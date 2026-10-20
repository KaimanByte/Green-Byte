import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { CollectionsRepository } from './collections.repository';
import { ServicesModule } from '../services/services.module';
import { RegionsModule } from '../regions/regions.module';

@Module({
  imports: [DatabaseModule, ServicesModule, RegionsModule],
  controllers: [CollectionsController],
  providers: [CollectionsService, CollectionsRepository],
  exports: [CollectionsService],
})
export class CollectionsModule {}