import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/Prisma.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    // Global Redis Configuration
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',

      },
    }),
    PrismaModule,
    JobsModule,
  ],
})
export class AppModule {}