import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { UsageService } from '@/modules/usage/usage.service';
import { PLAN_LIMITS } from '@/common/config/plans.config';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('repurpose-queue') private repurposeQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
  ) {}

  /**
   * Quota is claimed here rather than in a guard: guards run before the
   * ValidationPipe, so a guard would burn a user's monthly slot on requests
   * that are about to be rejected as malformed.
   */
  async initiateJob(
    videoUrl: string,
    userId: string,
    language: 'Arabic' | 'English' = 'Arabic',
    country?: string | null,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) throw new ForbiddenException('User not found');

    const limit = PLAN_LIMITS[user.plan];
    const metered = Number.isFinite(limit);

    if (!(await this.usage.tryConsume(userId, limit))) {
      throw new ForbiddenException(
        `Monthly limit reached (${limit} video). Upgrade to Pro for unlimited access.`,
      );
    }

    let jobId: string | undefined;

    // A dialect only means anything in Arabic, so an English job never carries
    // one — otherwise a stale selection would sit on the row misreporting what
    // was written.
    const dialect = language === 'Arabic' ? (country ?? null) : null;

    try {
      const job = await this.prisma.job.create({
        data: {
          videoUrl,
          status: 'QUEUED',
          language,
          country: dialect,
          userId,
        },
      });
      jobId = job.id;

      await this.repurposeQueue.add(
        'process-video',
        { jobId: job.id, videoUrl, language, country: dialect },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );

      return job;
    } catch (error) {
      // Unlimited plans were never counted, so there is nothing to give back.
      if (metered) await this.usage.release(userId);

      if (jobId) {
        await this.prisma.job
          .delete({ where: { id: jobId } })
          .catch(() => undefined);
      }

      throw error;
    }
  }

  /**
   * The ledger only needs to know *which* formats exist, so the bodies are
   * deliberately left out — they are the whole payload. Twenty jobs × four
   * pieces of generated prose was hundreds of KB of JSON per dashboard load,
   * spent rendering twelve 10px squares. `ContentViewer` calls `getJob` for the
   * one row the reader actually opens.
   */
  async getMyJobs(userId: string) {
    return this.prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { generatedContent: { select: { type: true } } },
    });
  }

  /** The full sheet, bodies included. Only `GET /jobs/:id` should use this. */
  async getJob(jobId: string, userId: string) {
    return this.prisma.job.findFirst({
      where: { id: jobId, userId },
      include: { generatedContent: true },
    });
  }

  /**
   * What the SSE stream sends on every tick. Same slim shape as the ledger, so
   * a completing job does not push four bodies down the wire to flip a row.
   */
  async getJobStatus(jobId: string, userId: string) {
    return this.prisma.job.findFirst({
      where: { id: jobId, userId },
      include: { generatedContent: { select: { type: true } } },
    });
  }

  async updateJobImageUrl(jobId: string, imageUrl: string) {
    return this.prisma.job.update({
      where: { id: jobId },
      data: { imageUrl },
    });
  }
}
