import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('repurpose-queue') private repurposeQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async initiateJob(
    videoUrl: string,
    userId: string,
    language: 'Arabic' | 'English' = 'Arabic',
  ) {
    const job = await this.prisma.job.create({
      data: { videoUrl, status: 'QUEUED', language, userId },
    });

    await this.repurposeQueue.add(
      'process-video',
      { jobId: job.id, videoUrl, language },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    return job;
  }

  async getMyJobs(userId: string) {
    return this.prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        generatedContent: { select: { type: true, body: true } },
      },
    });
  }

  async getJob(jobId: string, userId: string) {
    return this.prisma.job.findFirst({
      where: { id: jobId, userId },
      include: { generatedContent: true },
    });
  }
}
