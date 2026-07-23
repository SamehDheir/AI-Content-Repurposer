import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { usageKey, nextMonthStart } from '../config/plans.config';

/**
 * Reserves one unit of monthly quota and refuses if that would exceed the
 * limit. INCR, the TTL and the limit check happen in a single round trip so
 * two concurrent requests cannot both observe the pre-increment value.
 */
const CONSUME_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIREAT', KEYS[1], ARGV[2])
end
if current > tonumber(ARGV[1]) then
  redis.call('DECR', KEYS[1])
  return 0
end
return 1
`;

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Atomically claims one job against the user's monthly quota.
   * Returns false when the limit is already reached. Redis failures are
   * intentionally allowed to propagate so the caller fails closed.
   */
  async tryConsume(userId: string, limit: number): Promise<boolean> {
    if (!Number.isFinite(limit)) return true; // unlimited plan

    const key = usageKey(userId);
    const expireAt = Math.floor(nextMonthStart().getTime() / 1000);

    const allowed = await this.redis.eval(
      CONSUME_SCRIPT,
      [key],
      [limit, expireAt],
    );

    return allowed === 1;
  }

  /** Gives back a unit claimed by tryConsume when the job could not be created. */
  async release(userId: string): Promise<void> {
    try {
      await this.redis.decrement(usageKey(userId));
    } catch (error) {
      // Never mask the original failure that triggered the rollback.
      this.logger.error(
        `Failed to release usage for user ${userId}: ${toMessage(error)}`,
      );
    }
  }

  /** Display-only; degrades to zero so /users/me stays available. */
  async getUsage(userId: string): Promise<{ used: number; ttl: number }> {
    try {
      const key = usageKey(userId);
      const raw = await this.redis.get(key);
      const ttl = await this.redis.ttl(key);
      return {
        used: raw ? parseInt(raw, 10) : 0,
        ttl: ttl > 0 ? ttl : 0,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get usage for user ${userId}: ${toMessage(error)}`,
      );
      return { used: 0, ttl: 0 };
    }
  }
}
