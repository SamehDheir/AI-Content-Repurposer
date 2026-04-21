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
    language: 'Arabic' | 'English' = 'Arabic',
  ) {
    // 1. Create entry in DB
    const job = await this.prisma.job.create({
      data: { videoUrl, status: 'QUEUED', language: language },
    });

    // 2. Add to BullMQ
    await this.repurposeQueue.add(
      'process-video',
      {
        jobId: job.id,
        videoUrl: videoUrl,
        language: language,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    return job;
  }

  async getJobById(id: string) {
    return this.prisma.job.findUnique({
      where: { id },
      include: { generatedContent: true },
    });
  }
}
