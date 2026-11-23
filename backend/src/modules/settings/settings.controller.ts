import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/roles';
import { SettingsResponseDto } from './dto/settings-response.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Configurações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'operator')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({
    summary: 'Consulta a configuração do monitoramento',
    description: 'Intervalo de coleta e parâmetros de potência da máquina, com os padrões e a faixa aceita.',
  })
  @ApiOkResponse({ type: SettingsResponseDto })
  async get(): Promise<SettingsResponseDto> {
    return this.settingsService.getSettingsResponse();
  }

  @Patch()
  @Roles('admin', 'operator')
  @ApiOperation({
    summary: 'Altera a configuração do monitoramento',
    description:
      'Só os campos enviados mudam. O novo intervalo vale na hora (sem reiniciar); os parâmetros de potência valem a partir da próxima coleta e não recalculam o histórico. A alteração fica na auditoria.',
  })
  @ApiOkResponse({ type: SettingsResponseDto })
  @ApiBadRequestResponse({ description: 'Valor fora da faixa ou nenhum campo informado.' })
  @ApiForbiddenResponse({ description: 'Papel sem permissão para alterar.' })
  async update(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SettingsResponseDto> {
    return this.settingsService.update(dto, user);
  }
}
