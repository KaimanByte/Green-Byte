import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EnvironmentIndicatorsService } from './environment-indicators.service';
import { SUMMARY_UNITS, SummaryResponseDto } from './dto/history-summary.dto';
import { parseDateParam } from './period';

@ApiTags('Indicadores')
@Controller('summary')
export class SummaryController {
  constructor(private readonly indicatorsService: EnvironmentIndicatorsService) {}

  @Get()
  @ApiOperation({
    summary: 'Indicadores consolidados do ambiente',
    description: 'Sem from/to, usa as últimas 24h. O período efetivo e as unidades vão na resposta.',
  })
  @ApiQuery({ name: 'from', required: false, example: '2026-10-01T00:00:00Z' })
  @ApiQuery({ name: 'to', required: false, example: '2026-10-02T00:00:00Z' })
  @ApiOkResponse({ type: SummaryResponseDto })
  @ApiBadRequestResponse({ description: 'from/to inválidos ou from posterior a to.' })
  async getSummary(@Query('from') from?: string, @Query('to') to?: string): Promise<SummaryResponseDto> {
    const indicators = await this.indicatorsService.getEnvironmentIndicators(
      parseDateParam('from', from),
      parseDateParam('to', to),
    );

    return {
      period: {
        from: indicators.period.from.toISOString(),
        to: indicators.period.to.toISOString(),
      },
      units: SUMMARY_UNITS,
      totals: {
        energyKwh: indicators.totalEnergyKwh,
        co2Emissions: indicators.totalCo2Emissions,
      },
      services: {
        active: indicators.activeServices,
        unavailable: indicators.unavailableServices,
        withoutMetrics: indicators.servicesWithoutMetrics,
      },
    };
  }
}

