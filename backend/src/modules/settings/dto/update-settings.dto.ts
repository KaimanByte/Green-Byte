import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import {
  MAX_CONFIGURABLE_INTERVAL_SECONDS,
  MIN_CONFIGURABLE_INTERVAL_SECONDS,
} from '../../../common/collection-interval';

/** Limites dos parâmetros de potência: impedem valores absurdos que distorceriam todo o histórico futuro. */
export const SETTINGS_LIMITS = {
  collectionIntervalSeconds: { min: MIN_CONFIGURABLE_INTERVAL_SECONDS, max: MAX_CONFIGURABLE_INTERVAL_SECONDS },
  cpuMaxWatts: { min: 1, max: 2000 },
  ramWattsPerGb: { min: 0, max: 50 },
  diskWattsPerGb: { min: 0, max: 10 },
  networkWattsPerGb: { min: 0, max: 10 },
} as const;

const range = (label: string, { min, max }: { min: number; max: number }) =>
  `${label} deve ficar entre ${min} e ${max}.`;

/** Todos os campos são opcionais: só o que vier é alterado. */
export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: 'Intervalo entre coletas, em segundos', example: 60, minimum: 5, maximum: 86400 })
  @IsOptional()
  @IsInt({ message: 'O intervalo de coleta deve ser um número inteiro de segundos.' })
  @Min(SETTINGS_LIMITS.collectionIntervalSeconds.min, { message: range('O intervalo de coleta (s)', SETTINGS_LIMITS.collectionIntervalSeconds) })
  @Max(SETTINGS_LIMITS.collectionIntervalSeconds.max, { message: range('O intervalo de coleta (s)', SETTINGS_LIMITS.collectionIntervalSeconds) })
  collectionIntervalSeconds?: number;

  @ApiPropertyOptional({ description: 'Potência da CPU a 100% de uso (W)', example: 100 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'A potência máxima da CPU deve ser um número.' })
  @Min(SETTINGS_LIMITS.cpuMaxWatts.min, { message: range('A potência máxima da CPU (W)', SETTINGS_LIMITS.cpuMaxWatts) })
  @Max(SETTINGS_LIMITS.cpuMaxWatts.max, { message: range('A potência máxima da CPU (W)', SETTINGS_LIMITS.cpuMaxWatts) })
  cpuMaxWatts?: number;

  @ApiPropertyOptional({ description: 'Potência por GB de memória (W/GB)', example: 0.375 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'A potência da memória deve ser um número.' })
  @Min(SETTINGS_LIMITS.ramWattsPerGb.min, { message: range('A potência da memória (W/GB)', SETTINGS_LIMITS.ramWattsPerGb) })
  @Max(SETTINGS_LIMITS.ramWattsPerGb.max, { message: range('A potência da memória (W/GB)', SETTINGS_LIMITS.ramWattsPerGb) })
  ramWattsPerGb?: number;

  @ApiPropertyOptional({ description: 'Potência por GB de disco (W/GB)', example: 0.01 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'A potência do disco deve ser um número.' })
  @Min(SETTINGS_LIMITS.diskWattsPerGb.min, { message: range('A potência do disco (W/GB)', SETTINGS_LIMITS.diskWattsPerGb) })
  @Max(SETTINGS_LIMITS.diskWattsPerGb.max, { message: range('A potência do disco (W/GB)', SETTINGS_LIMITS.diskWattsPerGb) })
  diskWattsPerGb?: number;

  @ApiPropertyOptional({ description: 'Potência por GB de rede (W/GB)', example: 0.02 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'A potência da rede deve ser um número.' })
  @Min(SETTINGS_LIMITS.networkWattsPerGb.min, { message: range('A potência da rede (W/GB)', SETTINGS_LIMITS.networkWattsPerGb) })
  @Max(SETTINGS_LIMITS.networkWattsPerGb.max, { message: range('A potência da rede (W/GB)', SETTINGS_LIMITS.networkWattsPerGb) })
  networkWattsPerGb?: number;
}
