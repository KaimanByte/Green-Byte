import { Module, Global } from '@nestjs/common';
import { databaseProvider, DATABASE_CONNECTION } from './database.provider';
import { DatabaseRepository } from './repositories/database.repository';

@Global()
@Module({
  providers: [databaseProvider, DatabaseRepository],
  exports: [DATABASE_CONNECTION, DatabaseRepository],
})
export class DatabaseModule {}