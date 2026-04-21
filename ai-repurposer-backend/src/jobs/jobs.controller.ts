import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}
  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() dto: CreateJobDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.jobsService.initiateJob(dto.videoUrl, user.id, dto.language);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  getJob(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.jobsService.getJobById(id, user.id);
  }
}
