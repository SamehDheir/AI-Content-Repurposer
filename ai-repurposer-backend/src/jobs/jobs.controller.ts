import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  async createJob(@Body('videoUrl') videoUrl: string) {
    const job = await this.jobsService.initiateJob(videoUrl);
    return { jobId: job.id, status: job.status };
  }

  @Get(':id')
  async getJobStatus(@Param('id') id: string) {
    return this.jobsService.getJobById(id);
  }
}