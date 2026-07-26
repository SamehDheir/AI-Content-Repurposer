import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ContentType } from '@prisma/client';
import { TranscriptionService } from '@/modules/transcription/transcription.service';
import { AIService } from '@/modules/ai/ai.service';
import { ImageService } from '@/modules/image/image.service';
import { extractVideoId } from '@/common/utils/youtube.util';

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
    private readonly imageService: ImageService,
  ) {
    super();
  }

  async process(
    job: Job<{
      jobId: string;
      videoUrl: string;
      language?: 'Arabic' | 'English';
      country?: string | null;
    }>,
  ): Promise<void> {
    const { jobId, videoUrl, language = 'Arabic', country = null } = job.data;
    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
      throw new Error('Invalid YouTube URL - could not extract video ID');
    }

    this.logger.log(`Processing job ${jobId} for URL: ${videoUrl}`);

    try {
      const existingJob = await this.prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!existingJob) {
        this.logger.warn(`Job ${jobId} not found in DB — skipping`);
        return;
      }

      if (existingJob.status === 'COMPLETED') {
        this.logger.warn(`Job ${jobId} already COMPLETED — skipping`);
        return;
      }

      await this.setJobStatus(jobId, 'PROCESSING');

      // Step 1: Get transcript with retry logic
      let transcript: string;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (attempt === 1) {
            transcript =
              await this.transcriptionService.getTranscript(videoUrl);
          } else {
            transcript = await this.transcriptionService.retryTranscription(
              videoId,
              attempt,
            );
          }
          this.logger.log(`Transcript length: ${transcript.length} chars`);
          break;
        } catch (error: any) {
          this.logger.error(
            `Transcription attempt ${attempt} failed: ${error.message}`,
          );
          if (attempt === 3) {
            throw error;
          }
          this.logger.log(`Retrying transcription... (${attempt + 1}/3)`);
        }
      }

      // Cleanup audio file after successful transcription or max attempts
      await this.transcriptionService.cleanupAudioFile(videoId);

      // Step 2: Generate all content types in parallel
      const results = await Promise.all(
        CONTENT_TYPES.map(async (type) => {
          const body = await this.aiService.generateContent(type, transcript, {
            language,
            country,
          });
          return { type, body, jobId };
        }),
      );

      // Step 3: Save text content and mark job as COMPLETED
      await this.prisma.$transaction([
        this.prisma.generatedContent.deleteMany({ where: { jobId } }),
        this.prisma.generatedContent.createMany({ data: results }),
        this.prisma.job.update({
          where: { id: jobId },
          data: { status: 'COMPLETED' },
        }),
      ]);

      this.logger.log(`✅ Job ${jobId} completed successfully (text saved)`);
    } catch (error: any) {
      this.logger.error(`Job ${jobId} failed: ${error.message}`, error.stack);

      // Cleanup audio file on failure
      await this.transcriptionService.cleanupAudioFile(videoId);

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
