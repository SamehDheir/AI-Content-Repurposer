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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { Observable, interval } from 'rxjs';
import { switchMap, takeWhile, map } from 'rxjs/operators';
import { JobsService } from './jobs.service';
import { UsageLimitGuard } from 'src/guards/usage-limit.guard';
import { ImageService } from 'src/image/image.service';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jwt: JwtService,
    private readonly imageService: ImageService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), UsageLimitGuard) 
  create(
    @Body() body: { videoUrl: string; language?: 'Arabic' | 'English' },
    @Req() req: Request,
  ) {
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
  getJob(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.jobsService.getJob(id, user.id);
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
      }) as { sub: string };
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
  @UseGuards(AuthGuard('jwt'))
  async generateImage(
    @Body() body: { prompt: string; contentType?: string; content?: string },
  ) {
    if (body.content && body.contentType) {
      return this.imageService.generateImageFromContent(body.content, body.contentType);
    }
    return this.imageService.generateImage(body.prompt);
  }

  @Post(':id/generate-image')
  @UseGuards(AuthGuard('jwt'))
  async generateImageForJob(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    const job = await this.jobsService.getJob(id, user.id);
    
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'COMPLETED') {
      throw new Error('Job must be completed before generating image');
    }

    // Get transcript from blog post content
    const blogContent = job.generatedContent.find(c => c.type === 'BLOG_POST');
    if (!blogContent) {
      throw new Error('No blog content found');
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
