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
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from '@/common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    // Both entries must be NAMED. Left unnamed they both register as `default`,
    // so every request increments that one counter twice and each limit is
    // effectively halved — measured: a 5/min login limit rejected the third
    // attempt. Naming them also gives `@Throttle` something specific to
    // override: the decorators target `default`, leaving `hourly` in force.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
      {
        name: 'hourly',
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
  providers: [
    // Importing ThrottlerModule only *configures* throttling — it does not
    // enforce it. Without this binding no limit runs at all, which is how the
    // app shipped: the global 10/min and 100/hr above, and every @Throttle
    // override on login, register and job creation, were decorative. Login was
    // unlimited.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
