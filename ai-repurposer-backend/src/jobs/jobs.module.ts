import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobsProcessor } from './jobs.processor';
import { TranscriptionService } from 'src/transcription/transcription.service';
import { AIService } from 'src/ai/ai.service';
import { UsageModule } from '../usage/usage.module';
import { JwtModule } from '@nestjs/jwt';
import { ImageModule } from '../image/image.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'repurpose-queue' }),
    JwtModule,
    UsageModule,
    ImageModule,
  ],
  controllers: [JobsController],
  // PrismaService comes from the @Global PrismaModule — re-providing it here
  // would create a second client with its own connection pool.
  providers: [JobsService, JobsProcessor, TranscriptionService, AIService],
})
export class JobsModule {}
