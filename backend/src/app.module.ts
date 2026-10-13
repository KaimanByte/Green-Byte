import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ServicosModule } from './modules/servicos/servicos.module'; // <-- IMPORTAR AQUI

@Module({
  imports: [
    DatabaseModule,
    ServicosModule // <-- REGISTAR AQUI
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}