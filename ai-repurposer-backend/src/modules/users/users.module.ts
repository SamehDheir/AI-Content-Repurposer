import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsageModule } from '@/modules/usage/usage.module';

@Module({
  // PrismaService comes from the @Global PrismaModule.
  imports: [UsageModule],
  controllers: [UsersController],
})
export class UsersModule {}
