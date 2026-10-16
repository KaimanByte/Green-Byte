import { CollectionsService } from './collections.service';
import { CollectionsRepository } from './collections.repository';
import { ServicesService } from '../services/services.service';
import { RegionsService } from '../regions/regions.service';
import { jest } from '@jest/globals';

describe('CollectionsService', () => {
    const originalFetch = global.fetch;
    let service: CollectionsService;
    let fetchMock: jest.Mock;

    let repositoryMock: Partial<CollectionsRepository>;
    let servicesMock: Partial<ServicesService>;
    let regionsMock: Partial<RegionsService>;

    beforeEach(() => {
        process.env.METRICS_API_BASE_URL = 'https://metrics.unilaunch.org/';
        fetchMock = jest.fn();
        global.fetch = fetchMock as unknown as typeof fetch;

        repositoryMock = {
            insertMany: jest.fn(async (data) =>
                data.map((d, i) => ({
                    id: i + 1,
                    serviceId: d.serviceId,
                    cpuPercent: d.cpuPercent,
                    memoryGb: d.memoryGb,
                    diskGb: d.diskGb,
                    energyKwh: d.energyKwh,
                    co2Emissions: d.co2Emissions,
                    timestamp: d.timestamp ?? new Date(), // Garante o tipo Date
                })),
            ),
            findByServiceId: jest.fn(),
            getEmissionsByRegion: jest.fn(),
        };

        servicesMock = {
            findAllServices: jest.fn().mockResolvedValue([
                { id: 'billing-api', regionCode: 'br-sudeste' }
            ]),
        };

        regionsMock = {
            findRegionByCode: jest.fn().mockResolvedValue({
                codigoRegiao: 'br-sudeste',
                intensidadeCarbono: 85,
            }),
        };

        service = new CollectionsService(
            repositoryMock as CollectionsRepository,
            servicesMock as ServicesService,
            regionsMock as RegionsService,
        );
    });

    afterEach(() => {
        global.fetch = originalFetch;
        delete process.env.METRICS_API_BASE_URL;
        jest.clearAllMocks();
    });

    describe('syncCollections', () => {
        it('deve buscar métricas, calcular energia e emissões, e gravar no banco', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    collection_interval_seconds: 3600,
                    metrics: { cpu_percent: 50, memory_gb: 4, disk_gb: 10, network_gb: 1 }
                }),
            });

            const result = await service.syncCollections();

            expect(fetchMock).toHaveBeenCalledWith(
                'https://metrics.unilaunch.org/metrics/billing-api',
                expect.any(Object),
            );

            expect(repositoryMock.insertMany).toHaveBeenCalledTimes(1);

            const inserted = (repositoryMock.insertMany as jest.Mock).mock.calls[0][0][0];
            expect(inserted.serviceId).toBe('billing-api');
            expect(inserted.cpuPercent).toBe(50);
            expect(inserted.energyKwh).toBeDefined();
            expect(inserted.co2Emissions).toBeDefined();

            expect(result.total).toBe(1);
        });

        it('deve retornar lista vazia se não houver serviços para coletar', async () => {
            (servicesMock.findAllServices as jest.Mock).mockResolvedValue([]);

            const result = await service.syncCollections();

            expect(fetchMock).not.toHaveBeenCalled();
            expect(repositoryMock.insertMany).not.toHaveBeenCalled();
            expect(result.total).toBe(0);
        });
    });
});