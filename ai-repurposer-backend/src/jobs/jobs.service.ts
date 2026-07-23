import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { PLAN_LIMITS } from '../config/plans.config';

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

    try {
      const job = await this.prisma.job.create({
        data: { videoUrl, status: 'QUEUED', language, userId },
      });
      jobId = job.id;

      await this.repurposeQueue.add(
        'process-video',
        { jobId: job.id, videoUrl, language },
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

  async getMyJobs(userId: string) {
    return this.prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { generatedContent: { select: { type: true, body: true } } },
    });
  }

  async getJob(jobId: string, userId: string) {
    return this.prisma.job.findFirst({
      where: { id: jobId, userId },
      include: { generatedContent: true },
    });
  }

  async updateJobImageUrl(jobId: string, imageUrl: string) {
    return this.prisma.job.update({
      where: { id: jobId },
      data: { imageUrl },
    });
  }
}
