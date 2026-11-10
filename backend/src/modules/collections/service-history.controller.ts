import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ServiceHistoryService } from './service-history.service';
import { ServiceHistoryResponseDto } from './dto/history-summary.dto';
import { parseDateParam, parseLimitParam } from './period';

/**
 * Rota `/services/:id/history` hospedada no CollectionsModule para que o
 * ServicesModule não dependa dele (evita dependência circular).
 */
@ApiTags('Serviços')
@Controller('services')
export class ServiceHistoryController {
  constructor(private readonly historyService: ServiceHistoryService) {}

  @Get(':id/history')
  @ApiOperation({
    summary: 'Série temporal de coletas de um serviço',
    description: 'Sem from/to, usa as últimas 24h. O período efetivo e as unidades vão na resposta.',
  })
  @ApiParam({ name: 'id', example: 'billing-api' })
  @ApiQuery({ name: 'from', required: false, example: '2026-10-01T00:00:00Z' })
  @ApiQuery({ name: 'to', required: false, example: '2026-10-02T00:00:00Z' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 1000 })
  @ApiOkResponse({ type: ServiceHistoryResponseDto })
  @ApiBadRequestResponse({ description: 'from/to/limit inválidos ou from posterior a to.' })
  @ApiNotFoundResponse({ description: 'Serviço inexistente.' })
  async getHistory(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ): Promise<ServiceHistoryResponseDto> {
    return this.historyService.getHistory(
      id,
      parseDateParam('from', from),
      parseDateParam('to', to),
      parseLimitParam(limit),
    );
  }
}

