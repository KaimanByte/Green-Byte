import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import {
  CollectionResponseDto,
  RegionEmissionsDto,
  ServiceEmissionsDto,
  SyncCollectionsResponseDto,
} from './dto/collection.dto';

@ApiTags('Coletas e Emissões')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('service/:serviceId')
  @ApiOperation({ summary: 'Busca histórico de coletas de um serviço' })
  @ApiParam({ name: 'serviceId', example: 'billing-api' })
  @ApiQuery({ name: 'from', required: false, example: '2026-10-01T00:00:00.000Z' })
  @ApiQuery({ name: 'to', required: false, example: '2026-10-31T23:59:59.000Z' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 100 })
  @ApiOkResponse({ type: [CollectionResponseDto] })
  async getByService(
    @Param('serviceId') serviceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ): Promise<CollectionResponseDto[]> {
    return this.collectionsService.findHistory({
      serviceId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? Number(limit) : 100,
    });
  }

  @Get('emissions/region')
  @ApiOperation({ summary: 'Agrupa emissões e consumo de energia por região num período' })
  @ApiQuery({ name: 'start', example: '2026-10-01T00:00:00.000Z' })
  @ApiQuery({ name: 'end', example: '2026-10-31T23:59:59.000Z' })
  @ApiOkResponse({ type: [RegionEmissionsDto] })
  async getEmissionsByRegion(
    @Query('start') start: string,
    @Query('end') end: string,
  ): Promise<RegionEmissionsDto[]> {
    return this.collectionsService.getEmissionsByRegion(new Date(start), new Date(end));
  }

  @Get('emissions/service')
  @ApiOperation({ summary: 'Agrupa emissões e consumo de energia por serviço num período' })
  @ApiQuery({ name: 'start', example: '2026-10-01T00:00:00.000Z' })
  @ApiQuery({ name: 'end', example: '2026-10-31T23:59:59.000Z' })
  @ApiOkResponse({ type: [ServiceEmissionsDto] })
  async getEmissionsByService(
    @Query('start') start: string,
    @Query('end') end: string,
  ): Promise<ServiceEmissionsDto[]> {
    return this.collectionsService.getEmissionsByService(new Date(start), new Date(end));
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sincroniza métricas e calcula emissões',
    description: 'Varre todos os serviços ativos, busca suas métricas na API externa, cruza com a intensidade de carbono da região e grava a coleta calculada.',
  })
  @ApiOkResponse({ type: SyncCollectionsResponseDto })
  async syncCollections(): Promise<SyncCollectionsResponseDto> {
    return this.collectionsService.syncCollections();
  }
}