import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobsProcessor } from './jobs.processor';
import { UsageModule } from '@/modules/usage/usage.module';
import { JwtModule } from '@nestjs/jwt';
import { ImageModule } from '@/modules/image/image.module';
import { AIModule } from '@/modules/ai/ai.module';
import { TranscriptionModule } from '@/modules/transcription/transcription.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'repurpose-queue' }),
    JwtModule,
    UsageModule,
    ImageModule,
    AIModule,
    TranscriptionModule,
  ],
  controllers: [JobsController],
  // PrismaService comes from the @Global PrismaModule — re-providing it here
  // would create a second client with its own connection pool.
  providers: [JobsService, JobsProcessor],
})
export class JobsModule {}
