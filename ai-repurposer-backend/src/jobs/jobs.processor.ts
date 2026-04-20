import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ContentType } from '@prisma/client';
import { TranscriptionService } from 'src/transcription/transcription.service';
import { AIService } from 'src/ai/ai.service';

const CONTENT_TYPES: ContentType[] = [
  'TWITTER_THREAD',
  'BLOG_POST',
  'FACEBOOK_POST',
];

@Processor('repurpose-queue')
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transcriptionService: TranscriptionService,
    private readonly aiService: AIService,
  ) {
    super();
  }

  async process(job: Job<{ jobId: string; videoUrl: string }>): Promise<void> {
    const { jobId, videoUrl } = job.data;
    this.logger.log(`Processing job ${jobId} for URL: ${videoUrl}`);

    try {
      await this.setJobStatus(jobId, 'PROCESSING');

      // Step 1: Get transcript
      const transcript =
        await this.transcriptionService.getTranscript(videoUrl);
      this.logger.log(`Transcript length: ${transcript.length} chars`);

      // Step 2: Generate all content types in parallel
      const results = await Promise.all(
        CONTENT_TYPES.map(async (type) => {
          const body = await this.aiService.generateContent(type, transcript);
          return { type, body, jobId };
        }),
      );

      // Step 3: Save results and mark job as COMPLETED atomically
      await this.prisma.$transaction([
        this.prisma.generatedContent.createMany({ data: results }),
        this.prisma.job.update({
          where: { id: jobId },
          data: { status: 'COMPLETED' },
        }),
      ]);

      this.logger.log(`Job ${jobId} completed successfully`);
    } catch (error: any) {
      this.logger.error(`Job ${jobId} failed: ${error.message}`, error.stack);

      await this.setJobStatus(jobId, 'FAILED');

      // Re-throw so BullMQ can retry based on the job's attempts config
      throw error;
    }
  }

  private async setJobStatus(jobId: string, status: 'PROCESSING' | 'FAILED') {
    await this.prisma.job.update({
      where: { id: jobId },
      data: { status },
    });
  }
}
