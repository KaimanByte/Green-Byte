import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  DEFAULT_COLLECTION_INTERVAL_SECONDS,
  readCollectionIntervalFromEnv,
} from '../../common/collection-interval';
import { AuditActor, AuditService, diffFields } from '../audit/audit.service';
import { DEFAULT_ENERGY_MODEL, EnergyModel } from '../collections/energy.calculator';
import { SettingsResponseDto, SettingsValuesDto } from './dto/settings-response.dto';
import { SETTINGS_LIMITS, UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsRepository } from './settings.repository';
import { Settings } from './settings.schema';

const EDITABLE_FIELDS = [
  'collectionIntervalSeconds',
  'cpuMaxWatts',
  'ramWattsPerGb',
  'diskWattsPerGb',
  'networkWattsPerGb',
] as const;

type IntervalListener = (intervalSeconds: number) => void;

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly intervalListeners = new Set<IntervalListener>();

  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly auditService: AuditService,
  ) {}

  /** Valores padrão: modelo do desafio + intervalo padrão de coleta. */
  getDefaults(): SettingsValuesDto {
    return { collectionIntervalSeconds: DEFAULT_COLLECTION_INTERVAL_SECONDS, ...DEFAULT_ENERGY_MODEL };
  }

  /** Na primeira leitura a linha nasce com o intervalo do .env (COLLECTION_INTERVAL_SECONDS). */
  async getSettings(): Promise<Settings> {
    return this.settingsRepository.getSettings({ collectionIntervalSeconds: readCollectionIntervalFromEnv() });
  }

  async getSettingsResponse(): Promise<SettingsResponseDto> {
    return this.toResponse(await this.getSettings());
  }

  /** Parâmetros de potência usados no cálculo de energia das próximas coletas. */
  async getEnergyModel(): Promise<EnergyModel> {
    const { cpuMaxWatts, ramWattsPerGb, diskWattsPerGb, networkWattsPerGb } = await this.getSettings();
    return { cpuMaxWatts, ramWattsPerGb, diskWattsPerGb, networkWattsPerGb };
  }

  /** Avisa quando o intervalo de coleta muda (o agendador se reprograma sem reiniciar o backend). */
  onIntervalChange(listener: IntervalListener): void {
    this.intervalListeners.add(listener);
  }

  async update(dto: UpdateSettingsDto, actor: AuditActor): Promise<SettingsResponseDto> {
    const before = await this.getSettings();

    const data: UpdateSettingsDto = {};
    for (const field of EDITABLE_FIELDS) {
      if (dto[field] !== undefined) data[field] = dto[field];
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Informe ao menos um campo para alterar.');
    }

    const after = await this.settingsRepository.updateSettings(data);
    const changes = diffFields(before, after, EDITABLE_FIELDS);

    if (changes.length > 0) {
      await this.auditService.record(actor, 'settings.update', null, changes);
    }
    if (after.collectionIntervalSeconds !== before.collectionIntervalSeconds) {
      this.notifyIntervalChange(after.collectionIntervalSeconds);
    }

    return this.toResponse(after);
  }

  private notifyIntervalChange(intervalSeconds: number): void {
    for (const listener of this.intervalListeners) {
      try {
        listener(intervalSeconds);
      } catch (error) {
        // a configuração já foi salva; o novo intervalo passa a valer no próximo reinício
        this.logger.error(
          `Falha ao reprogramar a coleta: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  private toResponse(settings: Settings): SettingsResponseDto {
    return {
      collectionIntervalSeconds: settings.collectionIntervalSeconds,
      cpuMaxWatts: settings.cpuMaxWatts,
      ramWattsPerGb: settings.ramWattsPerGb,
      diskWattsPerGb: settings.diskWattsPerGb,
      networkWattsPerGb: settings.networkWattsPerGb,
      updatedAt: settings.updatedAt,
      defaults: this.getDefaults(),
      limits: SETTINGS_LIMITS,
    };
  }
}
