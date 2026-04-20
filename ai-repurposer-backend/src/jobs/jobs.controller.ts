import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createJob(@Body() dto: CreateJobDto) {
    if (!dto?.videoUrl) {
      throw new BadRequestException('videoUrl is required');
    }

    const job = await this.jobsService.initiateJob(dto.videoUrl);
    return { jobId: job.id, status: job.status };
  }

  @Get(':id')
  async getJobStatus(@Param('id') id: string) {
    if (!id?.trim()) {
      throw new BadRequestException('Job ID is required');
    }

    const job = await this.jobsService.getJobById(id);

    if (!job) {
      throw new NotFoundException(`Job with ID "${id}" not found`);
    }

    return job;
  }
}
