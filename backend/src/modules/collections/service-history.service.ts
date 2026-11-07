import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicesRepository } from '../services/services.repository';
import { CollectionsService } from './collections.service';
import { HISTORY_UNITS, ServiceHistoryResponseDto } from './dto/history-summary.dto';
import { resolvePeriod } from './period';

const DEFAULT_HISTORY_LIMIT = 1000;
const REMOVED_STATUS = 'removed';

/**
 * Caso de uso de `GET /services/:id/history` (API-03).
 * Valida existência do serviço, resolve o período e monta a resposta com unidades.
 */
@Injectable()
export class ServiceHistoryService {
  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly collectionsService: CollectionsService,
  ) {}

  async getHistory(
    serviceId: string,
    from?: Date,
    to?: Date,
    limit: number = DEFAULT_HISTORY_LIMIT,
  ): Promise<ServiceHistoryResponseDto> {
    const period = resolvePeriod(from, to);

    const service = await this.servicesRepository.findById(serviceId);
    if (!service || service.status === REMOVED_STATUS) {
      throw new NotFoundException(`Serviço "${serviceId}" não encontrado.`);
    }

    const points = await this.collectionsService.findHistory({
      serviceId,
      from: period.from,
      to: period.to,
      limit,
    });

    return {
      serviceId,
      period: { from: period.from.toISOString(), to: period.to.toISOString() },
      units: HISTORY_UNITS,
      total: points.length,
      points,
    };
  }
}

