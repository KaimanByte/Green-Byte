import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { requireEnv } from '../../common/env';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    // sem JWT_SECRET o backend não sobe: nada de chave padrão escrita no código
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: requireEnv('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
