import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { DEFAULT_ENERGY_MODEL } from '../collections/energy.calculator';
import { SettingsRepository } from './settings.repository';
import { Settings, UpdateSettings } from './settings.schema';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  const actor = { id: 1, email: 'admin@greenbyte.test' };
  let row: Settings;
  let getSettings: jest.Mock<(initial?: UpdateSettings) => Promise<Settings>>;
  let record: jest.Mock<(...args: unknown[]) => Promise<void>>;
  let service: SettingsService;
  const originalInterval = process.env.COLLECTION_INTERVAL_SECONDS;

  beforeEach(() => {
    delete process.env.COLLECTION_INTERVAL_SECONDS;
    row = {
      id: 1,
      collectionIntervalSeconds: 30,
      ...DEFAULT_ENERGY_MODEL,
      updatedAt: new Date('2026-11-01T00:00:00.000Z'),
    };
    getSettings = jest.fn(async () => row);
    record = jest.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined);

    const repository = {
      getSettings,
      updateSettings: async (data: UpdateSettings) => {
        row = { ...row, ...data };
        return row;
      },
    };
    service = new SettingsService(repository as unknown as SettingsRepository, { record } as unknown as AuditService);
  });

  afterEach(() => {
    if (originalInterval === undefined) delete process.env.COLLECTION_INTERVAL_SECONDS;
    else process.env.COLLECTION_INTERVAL_SECONDS = originalInterval;
  });

  it('na primeira leitura usa o intervalo do .env como valor inicial', async () => {
    process.env.COLLECTION_INTERVAL_SECONDS = '90';

    await service.getSettings();

    expect(getSettings).toHaveBeenCalledWith({ collectionIntervalSeconds: 90 });
  });

  it('devolve os valores junto com os padrões do modelo e os limites', async () => {
    const response = await service.getSettingsResponse();

    expect(response).toMatchObject({ collectionIntervalSeconds: 30, cpuMaxWatts: 100 });
    expect(response.defaults).toEqual({ collectionIntervalSeconds: 30, ...DEFAULT_ENERGY_MODEL });
    expect(response.limits.collectionIntervalSeconds).toEqual({ min: 5, max: 86400 });
  });

  it('entrega ao cálculo de energia os parâmetros salvos', async () => {
    row = { ...row, cpuMaxWatts: 180, ramWattsPerGb: 0.5 };

    await expect(service.getEnergyModel()).resolves.toEqual({
      cpuMaxWatts: 180,
      ramWattsPerGb: 0.5,
      diskWattsPerGb: 0.01,
      networkWattsPerGb: 0.02,
    });
  });

  it('salva, audita só os campos que mudaram e avisa o agendador do novo intervalo', async () => {
    const listener = jest.fn<(seconds: number) => void>();
    service.onIntervalChange(listener);

    const response = await service.update({ collectionIntervalSeconds: 60, cpuMaxWatts: 100 }, actor);

    expect(response.collectionIntervalSeconds).toBe(60);
    expect(record).toHaveBeenCalledWith(actor, 'settings.update', null, [
      { field: 'collectionIntervalSeconds', from: 30, to: 60 },
    ]);
    expect(listener).toHaveBeenCalledWith(60);
  });

  it('não avisa o agendador quando só os parâmetros da máquina mudam', async () => {
    const listener = jest.fn<(seconds: number) => void>();
    service.onIntervalChange(listener);

    await service.update({ cpuMaxWatts: 150 }, actor);

    expect(listener).not.toHaveBeenCalled();
    expect(record).toHaveBeenCalledWith(actor, 'settings.update', null, [
      { field: 'cpuMaxWatts', from: 100, to: 150 },
    ]);
  });

  it('não audita quando os valores enviados são iguais aos atuais', async () => {
    await service.update({ collectionIntervalSeconds: 30 }, actor);

    expect(record).not.toHaveBeenCalled();
  });

  it('recusa uma alteração sem nenhum campo', async () => {
    await expect(service.update({}, actor)).rejects.toThrow(BadRequestException);
  });

  it('mantém a configuração salva mesmo se o agendador falhar ao reprogramar', async () => {
    service.onIntervalChange(() => {
      throw new Error('agendador indisponível');
    });

    await expect(service.update({ collectionIntervalSeconds: 45 }, actor)).resolves.toMatchObject({
      collectionIntervalSeconds: 45,
    });
  });
});
