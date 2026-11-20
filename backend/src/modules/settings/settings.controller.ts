import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { Authorize } from '../auth/decorators/authorize.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CollectionHealthResponseDto, UpdateCollectionIntervalDto } from './dto/settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Configurações e Monitoramento')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('collection-health')
  @ApiOperation({
    summary: 'Consulta a saúde operacional da coleta e o intervalo efetivo de polling',
    description:
      'Retorna o estado atual (running, success, failed, no_data), duração, falha, quantidade de coletas gravadas, próximo ciclo e intervalo recomendado para o frontend (teto de 60s).',
  })
  @ApiOkResponse({ type: CollectionHealthResponseDto })
  getCollectionHealth(): Promise<CollectionHealthResponseDto> {
    return this.settingsService.getCollectionHealth();
  }

  @Patch('collection-interval')
  @Authorize('admin')
  @ApiOperation({
    summary: 'Atualiza o intervalo da coleta automática em tempo de execução',
    description:
      'Persiste o novo intervalo, reagenda o timer sem reiniciar o backend e registra trilha de auditoria. Exclusivo para admin.',
  })
  @ApiBody({ type: UpdateCollectionIntervalDto })
  @ApiOkResponse({ type: CollectionHealthResponseDto })
  @ApiBadRequestResponse({ description: 'Intervalo fora da faixa segura (1 a 86400 segundos).' })
  updateCollectionInterval(
    @Body() dto: UpdateCollectionIntervalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CollectionHealthResponseDto> {
    return this.settingsService.updateCollectionInterval(dto.collectionIntervalSeconds, actor);
  }
}
