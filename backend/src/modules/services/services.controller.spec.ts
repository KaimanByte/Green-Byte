import { jest } from '@jest/globals';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

describe('ServicesController', () => {
  it('delegates POST /services/sync to the service and returns its result', async () => {
    const syncResult = {
      total: 1,
      services: [
        {
          id: 'srv-1',
          name: 'Serviço Alpha',
          status: 'registered',
          regionCode: 'BR-SP',
          location: {
            country: 'Brasil',
            region: 'São Paulo',
            city: null,
            latitude: null,
            longitude: null,
          },
          metricsPath: null,
        },
      ],
    };
    const servicesService = {
      syncServices: jest.fn<() => Promise<typeof syncResult>>().mockResolvedValue(syncResult),
    };
    const controller = new ServicesController(servicesService as unknown as ServicesService);

    await expect(controller.syncServices()).resolves.toEqual(syncResult);
    expect(servicesService.syncServices).toHaveBeenCalledTimes(1);
  });
});
