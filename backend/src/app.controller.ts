import { Controller, Get } from '@nestjs/common';
import { DatabaseRepository } from './database/repositories/database.repository';

@Controller()
export class AppController {
  constructor(private readonly databaseRepository: DatabaseRepository) {}

  @Get('services')
  async getServices() {
    return await this.databaseRepository.getDevices();
  }
}