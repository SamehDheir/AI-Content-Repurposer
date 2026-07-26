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
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Observable, defer, timer } from 'rxjs';
import { repeat, takeWhile, map } from 'rxjs/operators';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { GenerateImageDto } from './dto/generate-image.dto';
import { ImageService } from '@/modules/image/image.service';

/** How long to wait before the next status query, by age of the stream. */
function pollDelay(openFor: number): number {
  if (openFor < 60_000) return 2_000;
  if (openFor < 5 * 60_000) return 6_000;
  return 20_000;
}

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly imageService: ImageService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for job creation
  @UseGuards(AuthGuard('jwt'))
  create(@Body() body: CreateJobDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.jobsService.initiateJob(
      body.videoUrl,
      user.id,
      body.language,
      body.country,
    );
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

  // Authenticated by the standard cookie guard. The token used to be passed as
  // a ?token= query parameter, which leaked it into access and proxy logs.
  //
  // This is still a database poll rather than a push — the worker does not
  // notify anything, so replacing it properly means Redis pub/sub out of
  // JobsProcessor. Until then the interval backs off: a typical job finishes
  // inside the first minute, and everything after that is a tab someone left
  // open on a slow or stuck video, which does not need a query every 2s.
  @Sse(':id/status')
  @UseGuards(AuthGuard('jwt'))
  streamJobStatus(
    @Param('id') id: string,
    @Req() req: Request,
  ): Observable<MessageEvent> {
    const { id: userId } = req.user as { id: string };
    const openedAt = Date.now();

    return defer(() => this.jobsService.getJobStatus(id, userId)).pipe(
      repeat({ delay: () => timer(pollDelay(Date.now() - openedAt)) }),
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
        { country: body.country },
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

    const blog = job.generatedContent.find((c) => c.type === 'BLOG_POST');
    const highlights = job.generatedContent.find(
      (c) => c.type === 'HIGHLIGHTS',
    );

    if (!blog && !highlights) {
      throw new NotFoundException('No content found for this job');
    }

    // Highlights are the same video reduced to its key moments, so pairing them
    // with the blog states the topic twice in two different shapes. That is the
    // signal the prompt model needs to land on the actual subject instead of
    // illustrating whatever the opening paragraph happened to mention.
    const source = [blog?.body, highlights?.body].filter(Boolean).join('\n\n');

    // The job already knows who it was written for, so the illustration is set
    // in the same place as the post.
    const imageUrl = await this.imageService.generateImageFromContent(
      source,
      'BLOG_POST',
      { country: job.country },
    );

    // Update job with imageUrl
    await this.jobsService.updateJobImageUrl(id, imageUrl);

    return { imageUrl };
  }
}
