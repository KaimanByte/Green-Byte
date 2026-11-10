import { Injectable } from '@nestjs/common';

/** Uso de recursos de um serviço em uma coleta. */
export interface ResourceUsage {
  cpuPercent: number;
  memoryGb: number;
  diskGb: number;
  networkGb: number;
}

export interface EnergyEstimate {
  /** Potência estimada do serviço durante a coleta (W). */
  powerWatts: number;
  /** Energia consumida no intervalo da coleta (kWh). */
  energyKwh: number;
  /** Emissões estimadas (gCO₂e) = energia × intensidade de carbono da região. */
  co2Emissions: number;
}

/** Constantes do modelo padrão de potência (W). */
export const ENERGY_MODEL = {
  /** Potência da CPU a 100% de uso. */
  CPU_MAX_POWER_W: 100,
  RAM_POWER_PER_GB_W: 0.375,
  DISK_POWER_PER_GB_W: 0.01,
  NETWORK_POWER_PER_GB_W: 0.02,
} as const;

/**
 * Regra de negócio do cálculo de energia e CO₂e, separada do CollectionsService
 * (que só orquestra API externa → cálculo → banco). Função pura: sem I/O.
 */
@Injectable()
export class EnergyCalculator {
  /** Potência (W) = CPU% × potência máxima + memória, disco e rede × potência por GB. */
  powerWatts(usage: ResourceUsage): number {
    return (
      (usage.cpuPercent / 100) * ENERGY_MODEL.CPU_MAX_POWER_W +
      usage.memoryGb * ENERGY_MODEL.RAM_POWER_PER_GB_W +
      usage.diskGb * ENERGY_MODEL.DISK_POWER_PER_GB_W +
      usage.networkGb * ENERGY_MODEL.NETWORK_POWER_PER_GB_W
    );
  }

  /**
   * Energia (kWh) = potência (W) × horas do intervalo ÷ 1000.
   * CO₂e (g) = energia (kWh) × intensidade de carbono (gCO₂e/kWh).
   */
  calculate(usage: ResourceUsage, intervalSeconds: number, carbonIntensity: number): EnergyEstimate {
    const powerWatts = this.powerWatts(usage);
    const energyKwh = (powerWatts * (intervalSeconds / 3600)) / 1000;
    const co2Emissions = energyKwh * carbonIntensity;

    return { powerWatts, energyKwh, co2Emissions };
  }
}
