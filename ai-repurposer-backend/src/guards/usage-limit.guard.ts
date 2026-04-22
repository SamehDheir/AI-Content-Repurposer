// src/guards/usage-limit.guard.ts
import {
  Injectable, CanActivate, ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PLAN_LIMITS, usageKey } from '../config/plans.config';

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req    = context.switchToHttp().getRequest();
    const user   = req.user as { id: string };

    const dbUser = await this.prisma.user.findUnique({
      where:  { id: user.id },
      select: { plan: true },
    });

    if (!dbUser) throw new ForbiddenException('User not found');

    // PRO
    if (dbUser.plan === 'PRO') return true;

    const limit = PLAN_LIMITS[dbUser.plan];
    const key   = usageKey(user.id);

    const raw  = await this.redis.get(key);
    const used = raw ? parseInt(raw, 10) : 0;

    if (used >= limit) {
      throw new ForbiddenException(
        `Monthly limit reached (${limit} video). Upgrade to Pro for unlimited access.`,
      );
    }

    return true;
  }
}