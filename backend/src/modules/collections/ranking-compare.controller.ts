import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CompareResponseDto, RankingResponseDto } from './dto/ranking-compare.dto';
import { parseDateParam } from './period';
import { parseCompareIds, parseMetricParam, RankingCompareService } from './ranking-compare.service';

@ApiTags('Ranking e Comparação')
@Controller()
export class RankingCompareController {
  constructor(private readonly service: RankingCompareService) {}

  @Get('ranking')
  @ApiOperation({
    summary: 'Ordena os serviços por consumo de energia ou emissão de CO2e no período',
    description: 'Sem from/to, usa as últimas 24h. Ativos vêm primeiro (decrescente); desempate por ID.',
  })
  @ApiQuery({ name: 'metric', enum: ['energia', 'co2e'], required: true, example: 'co2e' })
  @ApiQuery({ name: 'from', required: false, example: '2026-10-01T00:00:00Z' })
  @ApiQuery({ name: 'to', required: false, example: '2026-10-02T00:00:00Z' })
  @ApiOkResponse({ type: RankingResponseDto })
  @ApiBadRequestResponse({ description: 'metric ausente/inválido ou intervalo de datas inválido.' })
  async getRanking(
    @Query('metric') metric?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<RankingResponseDto> {
    return this.service.getRanking(
      parseMetricParam(metric),
      parseDateParam('from', from),
      parseDateParam('to', to),
    );
  }

  @Get('compare')
  @ApiOperation({
    summary: 'Compara 2 ou mais serviços no mesmo período',
    description: 'Aceita ids separados por vírgula (ids=a,b) ou repetidos. Sem from/to, usa as últimas 24h.',
  })
  @ApiQuery({ name: 'ids', required: true, example: 'billing-api,checkout-worker' })
  @ApiQuery({ name: 'from', required: false, example: '2026-10-01T00:00:00Z' })
  @ApiQuery({ name: 'to', required: false, example: '2026-10-02T00:00:00Z' })
  @ApiOkResponse({ type: CompareResponseDto })
  @ApiBadRequestResponse({ description: 'Menos de 2 IDs distintos ou datas inválidas.' })
  @ApiNotFoundResponse({ description: 'Algum dos serviços informados não existe.' })
  async compare(
    @Query('ids') ids?: string | string[],
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<CompareResponseDto> {
    return this.service.compareServices(
      parseCompareIds(ids),
      parseDateParam('from', from),
      parseDateParam('to', to),
    );
  }
}

