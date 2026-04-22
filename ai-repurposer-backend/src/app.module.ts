import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/Prisma.module';
import { JobsModule } from './jobs/jobs.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersController } from './users/users.controller';

@Module({
  imports: [
    // BullModule.forRoot({
    //   connection: {
    //     host: process.env.REDIS_HOST || 'localhost',
    //     port: parseInt(process.env.REDIS_PORT) || 6379,
    //     password: process.env.REDIS_PASSWORD,
    //   },
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    PrismaModule,
    JobsModule,
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [],
})
export class AppModule {}
