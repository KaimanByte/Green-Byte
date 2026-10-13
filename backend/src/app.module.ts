import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
//import { ServicesModule } from './modules/services/services.module'; // <-- IMPORTAR AQUI

@Module({
  imports: [
    DatabaseModule,
    //ServicesModule // <-- REGISTAR AQUI
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}