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
  'HIGHLIGHTS',
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

  async process(
    job: Job<{
      jobId: string;
      videoUrl: string;
      language?: 'Arabic' | 'English';
    }>,
  ): Promise<void> {
    const { jobId, videoUrl, language = 'Arabic' } = job.data;
    this.logger.log(`Processing job ${jobId} for URL: ${videoUrl}`);

    try {
      // تحقق إن الـ job موجود قبل أي عملية
      const existingJob = await this.prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!existingJob) {
        this.logger.warn(`Job ${jobId} not found in DB — skipping`);
        return;
      }

      // تجاهل لو اتشتغل قبل
      if (existingJob.status === 'COMPLETED') {
        this.logger.warn(`Job ${jobId} already COMPLETED — skipping`);
        return;
      }

      await this.setJobStatus(jobId, 'PROCESSING');

      // Step 1: Get transcript
      const transcript =
        await this.transcriptionService.getTranscript(videoUrl);
      this.logger.log(`Transcript length: ${transcript.length} chars`);

      // Step 2: Generate all content types in parallel
      const results = await Promise.all(
        CONTENT_TYPES.map(async (type) => {
          const body = await this.aiService.generateContent(
            type,
            transcript,
            language,
          );
          return { type, body, jobId };
        }),
      );

      // Step 3: Save results and mark job as COMPLETED atomically
      await this.prisma.$transaction([
        // احذف أي محتوى قديم لو كان في retry
        this.prisma.generatedContent.deleteMany({ where: { jobId } }),
        this.prisma.generatedContent.createMany({ data: results }),
        this.prisma.job.update({
          where: { id: jobId },
          data: { status: 'COMPLETED' },
        }),
      ]);

      this.logger.log(`✅ Job ${jobId} completed successfully`);
    } catch (error: any) {
      this.logger.error(`Job ${jobId} failed: ${error.message}`, error.stack);
      await this.setJobStatus(jobId, 'FAILED').catch((e) =>
        this.logger.error(`Failed to update status: ${e.message}`),
      );
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