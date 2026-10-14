import { Controller, Get } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiOperation,
  ApiGatewayTimeoutResponse,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { ServicoResponseDto } from './dto/servico-response.dto';

@ApiTags('Serviços')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista os serviços registrados com estado básico e localização',
    description:
      'Consulta a API Greener Metrics Aggregator e normaliza os dados para o contrato do Green Byte.',
  })
  @ApiOkResponse({
    description: 'Lista de serviços retornada com sucesso.',
    type: [ServicoResponseDto],
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
  async getServices(): Promise<ServicoResponseDto[]> {
    return this.servicesService.findAllServices();
  }
}
