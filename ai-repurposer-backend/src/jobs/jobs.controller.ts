import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  Sse,
  MessageEvent,
  Query,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { Observable, interval } from 'rxjs';
import { switchMap, takeWhile, map } from 'rxjs/operators';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { GenerateImageDto } from './dto/generate-image.dto';
import { ImageService } from 'src/image/image.service';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jwt: JwtService,
    private readonly imageService: ImageService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for job creation
  @UseGuards(AuthGuard('jwt'))
  create(@Body() body: CreateJobDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.jobsService.initiateJob(body.videoUrl, user.id, body.language);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getMyJobs(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.jobsService.getMyJobs(user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getJob(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    const job = await this.jobsService.getJob(id, user.id);
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  @Sse(':id/status')
  streamJobStatus(
    @Param('id') id: string,
    @Query('token') token: string,
  ): Observable<MessageEvent> {
    if (!token) throw new UnauthorizedException('Token required');

    let userId: string;
    try {
      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    return interval(2000).pipe(
      switchMap(() => this.jobsService.getJob(id, userId)),
      takeWhile(
        (job) => job?.status !== 'COMPLETED' && job?.status !== 'FAILED',
        true,
      ),
      map((job) => ({ data: JSON.stringify(job) }) as MessageEvent),
    );
  }

  @Post('generate-image')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 image generations per minute
  @UseGuards(AuthGuard('jwt'))
  async generateImage(@Body() body: GenerateImageDto) {
    if (body.content && body.contentType) {
      return this.imageService.generateImageFromContent(
        body.content,
        body.contentType,
      );
    }
    return this.imageService.generateImage(body.prompt!);
  }

  @Post(':id/generate-image')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 job image generations per minute
  @UseGuards(AuthGuard('jwt'))
  async generateImageForJob(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    const job = await this.jobsService.getJob(id, user.id);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Job must be completed before generating an image',
      );
    }

    // Get transcript from blog post content
    const blogContent = job.generatedContent.find(
      (c) => c.type === 'BLOG_POST',
    );
    if (!blogContent) {
      throw new NotFoundException('No blog content found for this job');
    }

    const imageUrl = await this.imageService.generateImageFromContent(
      blogContent.body,
      'BLOG_POST',
    );

    // Update job with imageUrl
    await this.jobsService.updateJobImageUrl(id, imageUrl);

    return { imageUrl };
  }
}
