import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor('repurpose-queue')
export class JobsProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { jobId, videoUrl } = job.data;

    try {
      // Update DB to Processing
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' },
      });

      // TODO: Integration with YouTube Transcription Service
      // TODO: Integration with AI Service (OpenAI/Anthropic)
      
      // Simulating work
      await new Promise((res) => setTimeout(res, 5000));

      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: 'COMPLETED' },
      });

    } catch (error) {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }
}