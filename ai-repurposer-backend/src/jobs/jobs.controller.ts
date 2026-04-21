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

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jwt: JwtService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
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
}
