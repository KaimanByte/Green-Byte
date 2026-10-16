import { Controller, Get, Param } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServiceResponseDto } from './dto/service.dto';
import { Service } from './services.schema';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async findAll(): Promise<ServiceResponseDto[]> {
    // Agora chama o método com o nome exato que está no Service
    return this.servicesService.findAllServices();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Service> {
    // Chama o método findById que vamos adicionar de volta no Service
    return this.servicesService.findById(id);
  }
}