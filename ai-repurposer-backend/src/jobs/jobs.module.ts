import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobsProcessor } from './jobs.processor';
import { TranscriptionService } from 'src/transcription/transcription.service';
import { AIService } from 'src/ai/ai.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'repurpose-queue' })],
  controllers: [JobsController],
  providers: [
    JobsService,
    JobsProcessor,
    TranscriptionService,
    AIService,
    PrismaService,
  ],
})
export class JobsModule {}
