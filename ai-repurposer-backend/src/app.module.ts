import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/Prisma.module';
import { JobsModule } from './jobs/jobs.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersController } from './users/users.controller';
import { RedisModule } from './redis/redis.module';
import { UsageModule } from './usage/usage.module';
import { ImageModule } from './image/image.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    PrismaModule,
    JobsModule,
    AuthModule,
    RedisModule,
    UsageModule,
    ImageModule
  ],
  controllers: [UsersController],
  providers: [],
})
export class AppModule {}
