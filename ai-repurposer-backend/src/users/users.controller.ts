// src/users/users.controller.ts
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { PLAN_LIMITS } from '../config/plans.config';
import type  { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req: Request) {
    const user = req.user as { id: string };

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id:                true,
        email:             true,
        name:              true,
        plan:              true,
        jobsUsedThisMonth: true,
        usagePeriodStart:  true,
        createdAt:         true,
      },
    });

    const limit = PLAN_LIMITS[dbUser!.plan];

    return {
      ...dbUser,
      usage: {
        used:      dbUser!.jobsUsedThisMonth,
        limit:     limit === Infinity ? null : limit,
        remaining: limit === Infinity ? null : limit - dbUser!.jobsUsedThisMonth,
        resetsAt:  getNextMonthStart(new Date(dbUser!.usagePeriodStart)),
      },
    };
  }
}

function getNextMonthStart(from: Date): Date {
  return new Date(from.getFullYear(), from.getMonth() + 1, 1);
}