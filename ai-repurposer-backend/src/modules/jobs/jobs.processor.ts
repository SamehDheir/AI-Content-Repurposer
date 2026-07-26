import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ContentType } from '@prisma/client';
import { TranscriptionService } from '@/modules/transcription/transcription.service';
import { AIService } from '@/modules/ai/ai.service';
import { ImageService } from '@/modules/image/image.service';
import { extractVideoId } from '@/common/utils/youtube.util';
import { safeJobError, toUserMessage } from './job-error';

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

    // Measured against BullMQ 5: inside `process` the counter is 0-based
    // (0, 1, 2 across three attempts) and has only been incremented by the time
    // the `failed` event fires. So the run in progress is attemptsMade + 1.
    const totalAttempts = job.opts.attempts ?? 1;
    const attemptNumber = job.attemptsMade + 1;
    const isFinalAttempt = attemptNumber >= totalAttempts;

    this.logger.log(
      `Processing job ${jobId} (attempt ${attemptNumber}/${totalAttempts})`,
    );

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

      // Step 1: transcript.
      //
      // There used to be a `for (attempt 1..3)` loop here, nested inside
      // BullMQ's own 3 attempts — up to nine transcriptions, and nine audio
      // downloads, for one job. BullMQ already retries with exponential
      // backoff, so it owns retrying and this just runs once.
      const transcript = await this.transcriptionService.getTranscript(
        videoUrl,
        attemptNumber,
      );
      this.logger.log(`Transcript length: ${transcript.length} chars`);

      // Succeeded, so the downloaded audio has no further use.
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
          data: { status: 'COMPLETED', error: null },
        }),
      ]);

      this.logger.log(`✅ Job ${jobId} completed successfully (text saved)`);
    } catch (error: any) {
      this.logger.error(
        `Job ${jobId} attempt ${attemptNumber}/${totalAttempts} failed: ${error.message}`,
        error.stack,
      );

      if (isFinalAttempt) {
        // No further attempt will want the audio.
        await this.transcriptionService.cleanupAudioFile(videoId);

        // FAILED used to be written on every attempt, including 1 and 2 of 3.
        // The SSE stream completes on FAILED, so the dashboard showed a
        // terminal failure while the job was still retrying for another ~15
        // seconds, and then silently succeeded behind a card that said Failed.
        await this.setJobFailed(jobId, toUserMessage(error)).catch((e) =>
          this.logger.error(`Failed to record failure: ${e.message}`),
        );
      } else {
        // Deliberately keep the downloaded audio: the next attempt reuses it
        // rather than pulling the whole file again.
        this.logger.log(
          `Keeping audio for attempt ${attemptNumber + 1}; job stays PROCESSING`,
        );
      }

      throw error;
    }
  }

  // Clears any previous reason: a job going round again must not keep showing
  // why it failed last time.
  private async setJobStatus(jobId: string, status: 'PROCESSING') {
    await this.prisma.job.update({
      where: { id: jobId },
      data: { status, error: null },
    });
  }

  private async setJobFailed(jobId: string, message: string) {
    await this.prisma.job.update({
      where: { id: jobId },
      data: { status: 'FAILED', error: safeJobError(message) },
    });
  }
}
