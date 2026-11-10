import { Module } from '@nestjs/common';
import { CarbonApiClient } from './carbon-api.client';
import { ExternalHttpClient } from './external-http.client';
import { MetricsApiClient } from './metrics-api.client';

/**
 * Clientes das APIs externas da GreenER. Os módulos de domínio (services, regions,
 * collections) dependem destes clientes por injeção, sem chamar fetch diretamente.
 */
@Module({
  providers: [ExternalHttpClient, MetricsApiClient, CarbonApiClient],
  exports: [MetricsApiClient, CarbonApiClient],
})
export class IntegrationsModule {}
