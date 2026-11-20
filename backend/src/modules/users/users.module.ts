import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UserLifecyclePolicy } from './user-lifecycle.policy';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UserLifecyclePolicy],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
