import { GUARDS_METADATA } from '@nestjs/common/constants';
import { HealthController } from './health.controller';
import type { CollectionStatus, StartupSyncService } from '../../startup-sync.service';

describe('HealthController', () => {
  const controllerFor = (status: CollectionStatus) =>
    new HealthController({ getStatus: () => status } as unknown as StartupSyncService);

  it('responde ok antes do primeiro ciclo de coleta', () => {
    const health = controllerFor({ intervalSeconds: 30, isRunning: true, nextRunAt: null, lastCycle: null }).getHealth();

    expect(health).toEqual({
      status: 'ok',
      uptimeSeconds: expect.any(Number),
      collection: { intervalSeconds: 30, isRunning: true, lastCycleSucceeded: null, lastCycleAt: null },
    });
  });

  it('continua ok quando o último ciclo falhou, sem expor a etapa nem a mensagem do erro', () => {
    const finishedAt = new Date('2026-11-22T18:00:01.200Z');
    const health = controllerFor({
      intervalSeconds: 60,
      isRunning: false,
      nextRunAt: new Date('2026-11-22T18:01:01.200Z'),
      lastCycle: {
        trigger: 'periódico',
        startedAt: new Date('2026-11-22T18:00:00.000Z'),
        finishedAt,
        durationMs: 1200,
        succeeded: false,
        failedStep: 'coleta de métricas',
        errorMessage: 'API externa fora do ar',
        collectionsSaved: 0,
      },
    }).getHealth();

    expect(health.status).toBe('ok');
    expect(health.collection).toEqual({ intervalSeconds: 60, isRunning: false, lastCycleSucceeded: false, lastCycleAt: finishedAt });
    expect(JSON.stringify(health)).not.toContain('API externa fora do ar');
  });

  it('é pública: não exige token', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, HealthController)).toBeUndefined();
    expect(Reflect.getMetadata(GUARDS_METADATA, HealthController.prototype.getHealth)).toBeUndefined();
  });
});
