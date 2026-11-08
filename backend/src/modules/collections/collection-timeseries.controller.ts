import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CollectionTimeSeriesService, parseBucketSecondsParam } from './collection-timeseries.service';
import { TimeSeriesCompareResponseDto, TimeSeriesResponseDto } from './dto/timeseries.dto';
import { parseDateParam } from './period';
import { parseCompareIds } from './ranking-compare.service';

/**
 * `GET /collections/timeseries` em controller próprio para não alterar o CollectionsController.
 * Mesmo prefixo de rota, rota nova: nenhuma rota existente muda.
 */
@ApiTags('Coletas e Emissões')
@Controller('collections')
export class CollectionTimeSeriesController {
  constructor(private readonly timeSeriesService: CollectionTimeSeriesService) {}

  @Get('timeseries')
  @ApiOperation({
    summary: 'Evolução das métricas coletadas ao longo do tempo',
    description:
      'Agrupa as coletas gravadas em intervalos de bucketSeconds e devolve a MÉDIA de cada métrica por intervalo ' +
      '(não é soma acumulada). Sem serviceId, considera todos os serviços. Sem from/to, usa as últimas 24h. ' +
      'Sem bucketSeconds, divide o período em ~120 intervalos (mínimo 30 s).',
  })
  @ApiQuery({ name: 'from', required: false, example: '2026-10-01T00:00:00Z' })
  @ApiQuery({ name: 'to', required: false, example: '2026-10-02T00:00:00Z' })
  @ApiQuery({ name: 'serviceId', required: false, example: 'billing-api' })
  @ApiQuery({ name: 'bucketSeconds', required: false, type: Number, example: 900 })
  @ApiOkResponse({ type: TimeSeriesResponseDto })
  @ApiBadRequestResponse({ description: 'from/to/bucketSeconds inválidos ou intervalos demais.' })
  @ApiNotFoundResponse({ description: 'Serviço inexistente.' })
  async getTimeSeries(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('serviceId') serviceId?: string,
    @Query('bucketSeconds') bucketSeconds?: string,
  ): Promise<TimeSeriesResponseDto> {
    return this.timeSeriesService.getTimeSeries(
      parseDateParam('from', from),
      parseDateParam('to', to),
      serviceId?.trim() || undefined,
      parseBucketSecondsParam(bucketSeconds),
    );
  }

  @Get('timeseries/compare')
  @ApiOperation({
    summary: 'Comparação histórica: evolução de 2 ou mais serviços no mesmo período',
    description:
      'Devolve UMA série por serviço (na ordem dos ids), todas com o mesmo período e bucketSeconds. ' +
      'Cada ponto é a MÉDIA das coletas daquele serviço no intervalo — sem somar serviços e sem acumular no tempo. ' +
      'Intervalos sem coleta não são retornados. Aceita ids=a,b ou ids repetidos (2 a 10 serviços). ' +
      'Sem from/to, usa as últimas 24h; sem bucketSeconds, ~120 intervalos (mínimo 30 s).',
  })
  @ApiQuery({ name: 'ids', required: true, example: 'billing-api,auth-api' })
  @ApiQuery({ name: 'from', required: false, example: '2026-10-01T00:00:00Z' })
  @ApiQuery({ name: 'to', required: false, example: '2026-10-02T00:00:00Z' })
  @ApiQuery({ name: 'bucketSeconds', required: false, type: Number, example: 900 })
  @ApiOkResponse({ type: TimeSeriesCompareResponseDto })
  @ApiBadRequestResponse({
    description: 'Menos de 2 ou mais de 10 ids distintos, datas/bucketSeconds inválidos ou intervalos demais.',
  })
  @ApiNotFoundResponse({ description: 'Algum dos serviços informados não existe.' })
  async compareTimeSeries(
    @Query('ids') ids?: string | string[],
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('bucketSeconds') bucketSeconds?: string,
  ): Promise<TimeSeriesCompareResponseDto> {
    return this.timeSeriesService.compareTimeSeries(
      parseCompareIds(ids),
      parseDateParam('from', from),
      parseDateParam('to', to),
      parseBucketSecondsParam(bucketSeconds),
    );
  }
}
