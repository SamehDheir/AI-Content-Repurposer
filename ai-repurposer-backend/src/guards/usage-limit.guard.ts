import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PLAN_LIMITS } from '../config/plans.config';

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { id: string };

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) throw new ForbiddenException('User not found');

    const now = new Date();
    const periodStart = new Date(dbUser.usagePeriodStart);
    const monthPassed =
      now.getFullYear() > periodStart.getFullYear() ||
      now.getMonth() > periodStart.getMonth();

    if (monthPassed) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          jobsUsedThisMonth: 0,
          usagePeriodStart: now,
        },
      });
      dbUser.jobsUsedThisMonth = 0;
    }

    const limit = PLAN_LIMITS[dbUser.plan];

    if (dbUser.jobsUsedThisMonth >= limit) {
      throw new ForbiddenException(
        `Monthly limit reached (${limit} videos). Upgrade to Pro for unlimited access.`,
      );
    }

    req.dbUser = dbUser;
    return true;
  }
}
