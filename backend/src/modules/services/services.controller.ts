import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { ServiceResponseDto } from './dto/service.dto';
import { Service } from './services.schema';

@ApiTags('Serviços')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista todos os serviços',
    description:
      'Retorna a lista de serviços cadastrados no banco de dados. Caso a base esteja vazia, a sincronização é acionada automaticamente.',
  })
  @ApiOkResponse({
    description: 'Lista de serviços retornada com sucesso.',
    type: [ServiceResponseDto],
  })
  async findAll(): Promise<ServiceResponseDto[]> {
    // Agora chama o método com o nome exato que está no Service
    return this.servicesService.findAllServices();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca um serviço pelo ID',
    description:
      'Retorna os detalhes de um serviço específico através do seu identificador único.',
  })
  @ApiParam({
    name: 'id',
    example: 'billing-api',
    description: 'Identificador único do serviço (ex: billing-api, checkout-worker)',
  })
  @ApiOkResponse({
    description: 'Serviço encontrado com sucesso.',
    // Usamos o DTO aqui para o Swagger conseguir mapear as propriedades na UI,
    // já que o tipo "Service" do Drizzle não existe em tempo de execução.
    type: ServiceResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Serviço não encontrado.' })
  async findOne(@Param('id') id: string): Promise<Service> {
    // Chama o método findById que vamos adicionar de volta no Service
    return this.servicesService.findById(id);
  }
}