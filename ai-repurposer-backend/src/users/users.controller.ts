// src/users/users.controller.ts
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { PLAN_LIMITS, nextMonthStart } from '../config/plans.config';

@Controller('users')
export class UsersController {
  constructor(
    private readonly prisma:  PrismaService,
    private readonly usage:   UsageService,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req: Request) {
    const { id } = req.user as { id: string };

    const [dbUser, { used, ttl }] = await Promise.all([
      this.prisma.user.findUnique({
        where:  { id },
        select: { id: true, email: true, name: true, plan: true, createdAt: true },
      }),
      this.usage.getUsage(id),
    ]);

    const limit     = PLAN_LIMITS[dbUser!.plan];
    const resetsAt  = new Date(Date.now() + ttl * 1000);

    return {
      ...dbUser,
      usage: {
        used,
        limit:     limit === Infinity ? null : limit,
        remaining: limit === Infinity ? null : Math.max(0, limit - used),
        resetsAt:  ttl > 0 ? resetsAt : nextMonthStart(),
      },
    };
  }
}