import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditController } from './audit.controller';
import { AuditRepository } from './audit.repository';
import { AuditSanitizer } from './audit.sanitizer';
import { AuditService } from './audit.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AuditController],
  providers: [AuditService, AuditRepository, AuditSanitizer],
  exports: [AuditService, AuditSanitizer],
})
export class AuditModule {}
