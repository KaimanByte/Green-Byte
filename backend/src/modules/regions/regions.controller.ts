import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiGatewayTimeoutResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { RegiaoResponseDto } from './dto/regiao-response.dto';
import { SincronizacaoRegioesResponseDto } from './dto/sincronizacao-regioes-response.dto';

@ApiTags('Regiões')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista as regiões com intensidade de carbono',
    description:
      'Retorna as regiões gravadas no banco. Use POST /regions/sync para carregá-las da API Greener Carbon Intensity.',
  })
  @ApiOkResponse({
    description: 'Lista de regiões retornada com sucesso.',
    type: [RegiaoResponseDto],
  })
  async getRegions(): Promise<RegiaoResponseDto[]> {
    return this.regionsService.findAllRegions();
  }

  @Get(':codigoRegiao')
  @ApiOperation({ summary: 'Busca uma região pelo código' })
  @ApiParam({
    name: 'codigoRegiao',
    example: 'br-sudeste',
    description: 'Código da região (region_code)',
  })
  @ApiOkResponse({
    description: 'Região encontrada.',
    type: RegiaoResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Região não encontrada.' })
  async getRegionByCode(
    @Param('codigoRegiao') codigoRegiao: string,
  ): Promise<RegiaoResponseDto> {
    return this.regionsService.findRegionByCode(codigoRegiao);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sincroniza as regiões com a API Greener Carbon Intensity',
    description:
      'Consulta GET /regions na API externa e grava (insere ou atualiza) cada região no banco.',
  })
  @ApiOkResponse({
    description: 'Regiões sincronizadas com sucesso.',
    type: SincronizacaoRegioesResponseDto,
  })
  @ApiBadGatewayResponse({
    description: 'A API externa retornou erro ou dados em formato inválido.',
  })
  @ApiServiceUnavailableResponse({
    description: 'Não foi possível conectar à API externa.',
  })
  @ApiGatewayTimeoutResponse({
    description: 'A API externa excedeu o tempo limite da requisição.',
  })
  async syncRegions(): Promise<SincronizacaoRegioesResponseDto> {
    return this.regionsService.syncRegions();
  }
}
