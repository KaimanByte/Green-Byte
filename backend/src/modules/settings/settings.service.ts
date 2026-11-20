import { BadRequestException, Injectable } from '@nestjs/common';
import { StartupSyncService } from '../../startup-sync.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { CollectionHealthResponseDto } from './dto/settings.dto';
import { MAX_UPDATE_INTERVAL_SECONDS, MIN_COLLECTION_INTERVAL_SECONDS } from './polling-interval';
import { SettingsRepository } from './settings.repository';

@Injectable()
export class SettingsService {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly startupSyncService: StartupSyncService,
    private readonly auditService: AuditService,
  ) {}

  async getCollectionHealth(): Promise<CollectionHealthResponseDto> {
    return this.startupSyncService.getHealthStatus();
  }

  async updateCollectionInterval(
    intervalSeconds: number,
    actor: AuthenticatedUser,
  ): Promise<CollectionHealthResponseDto> {
    if (
      !Number.isSafeInteger(intervalSeconds) ||
      intervalSeconds < MIN_COLLECTION_INTERVAL_SECONDS ||
      intervalSeconds > MAX_UPDATE_INTERVAL_SECONDS
    ) {
      throw new BadRequestException(
        `O intervalo de coleta deve ser um inteiro entre ${MIN_COLLECTION_INTERVAL_SECONDS} e ${MAX_UPDATE_INTERVAL_SECONDS} segundos.`,
      );
    }

    const currentSettings = await this.settingsRepository.getSettings();
    const previousInterval =
      currentSettings?.collectionIntervalSeconds ?? this.startupSyncService.getEffectiveIntervalSeconds();

    const updatedSettings = await this.settingsRepository.updateSettings({
      collectionIntervalSeconds: intervalSeconds,
    });

    const health = this.startupSyncService.reschedulePeriodicSync(intervalSeconds);

    await this.auditService.recordMonitoringConfigUpdated(
      actor,
      updatedSettings.id,
      { collectionIntervalSeconds: previousInterval },
      { collectionIntervalSeconds: updatedSettings.collectionIntervalSeconds },
    );

    return health;
  }
}
