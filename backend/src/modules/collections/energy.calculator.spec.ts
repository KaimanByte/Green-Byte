import { ENERGY_MODEL, EnergyCalculator, ResourceUsage } from './energy.calculator';

describe('EnergyCalculator', () => {
  const calculator = new EnergyCalculator();

  // exemplo do modelo: 50 W (CPU) + 0,75 W (RAM) + 0,1 W (disco) + 0,02 W (rede) = 50,87 W
  const usage: ResourceUsage = { cpuPercent: 50, memoryGb: 2, diskGb: 10, networkGb: 1 };

  it('calcula a potência com as constantes do modelo', () => {
    expect(calculator.powerWatts(usage)).toBeCloseTo(50.87, 10);
  });

  it('cada recurso contribui com a constante correspondente', () => {
    const zero: ResourceUsage = { cpuPercent: 0, memoryGb: 0, diskGb: 0, networkGb: 0 };

    expect(calculator.powerWatts({ ...zero, cpuPercent: 100 })).toBe(ENERGY_MODEL.CPU_MAX_POWER_W);
    expect(calculator.powerWatts({ ...zero, memoryGb: 1 })).toBe(ENERGY_MODEL.RAM_POWER_PER_GB_W);
    expect(calculator.powerWatts({ ...zero, diskGb: 1 })).toBe(ENERGY_MODEL.DISK_POWER_PER_GB_W);
    expect(calculator.powerWatts({ ...zero, networkGb: 1 })).toBe(ENERGY_MODEL.NETWORK_POWER_PER_GB_W);
  });

  it('calcula energia (kWh) e CO₂e (g) com valores conhecidos', () => {
    // 50,87 W × (60 s / 3600) h ÷ 1000 = 0,000847833… kWh; × 85 gCO₂e/kWh = 0,0720658… g
    const result = calculator.calculate(usage, 60, 85);

    expect(result.powerWatts).toBeCloseTo(50.87, 10);
    expect(result.energyKwh).toBeCloseTo(0.000847833333, 12);
    expect(result.co2Emissions).toBeCloseTo(0.072065833333, 12);
    expect(Number.isFinite(result.energyKwh)).toBe(true);
    expect(Number.isFinite(result.co2Emissions)).toBe(true);
  });

  it('1 kW durante 1 hora dá exatamente 1 kWh', () => {
    // 1000 W = CPU a 100% (100 W) + 2400 GB de RAM (900 W)
    const result = calculator.calculate({ cpuPercent: 100, memoryGb: 2400, diskGb: 0, networkGb: 0 }, 3600, 400);

    expect(result.energyKwh).toBeCloseTo(1, 12);
    expect(result.co2Emissions).toBeCloseTo(400, 9);
  });

  it('energia cresce na mesma proporção do intervalo da coleta', () => {
    const half = calculator.calculate(usage, 30, 85);
    const full = calculator.calculate(usage, 60, 85);

    expect(full.energyKwh).toBeCloseTo(half.energyKwh * 2, 15);
  });

  it('sem uso de recursos ou com intensidade zero, as emissões são zero', () => {
    const idle = calculator.calculate({ cpuPercent: 0, memoryGb: 0, diskGb: 0, networkGb: 0 }, 60, 85);
    expect(idle.energyKwh).toBe(0);
    expect(idle.co2Emissions).toBe(0);

    expect(calculator.calculate(usage, 60, 0).co2Emissions).toBe(0);
  });
});
