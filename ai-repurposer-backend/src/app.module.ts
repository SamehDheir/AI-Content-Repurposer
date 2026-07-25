import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { JobsModule } from '@/modules/jobs/jobs.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { RedisModule } from '@/infra/redis/redis.module';
import { UsageModule } from '@/modules/usage/usage.module';
import { ImageModule } from '@/modules/image/image.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
      {
        ttl: 3600000, // 1 hour
        limit: 100, // 100 requests per hour
      },
    ]),
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
    ImageModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
