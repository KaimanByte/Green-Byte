/*import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServicosService } from './services.service';
import { ServicoResponseDto } from './dto/servico-response.dto';

@ApiTags('Serviços')
@Controller('services')
export class ServicosController {
  constructor(private readonly servicosService: ServicosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os serviços com estado e localização' })
  @ApiResponse({
    status: 200,
    description: 'Lista de serviços retornada com sucesso.',
    type: [ServicoResponseDto],
  })
  async getServices() {
    return this.servicosService.findAllServices();
  }
}
  */
