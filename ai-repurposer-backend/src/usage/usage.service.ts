import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { usageKey, nextMonthStart } from '../config/plans.config';

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private readonly redis: RedisService) {}

  async increment(userId: string): Promise<number> {
    try {
      const key   = usageKey(userId);
      const count = await this.redis.increment(key);

      if (count === 1) {
        await this.redis.expireAt(key, nextMonthStart()).catch(e => {
          this.logger.warn(`Failed to set expiry for key ${key}: ${e.message}`);
        });
      }

      return count;
    } catch (error:any) {
      this.logger.error(`Failed to increment usage for user ${userId}: ${error.message}`);
      return 0;
    }
  }

  async getUsage(userId: string): Promise<{ used: number; ttl: number }> {
    try {
      const key  = usageKey(userId);
      const raw  = await this.redis.get(key);
      const ttl  = await this.redis.ttl(key);
      return {
        used: raw ? parseInt(raw, 10) : 0,
        ttl:  ttl > 0 ? ttl : 0,
      };
    } catch (error:any) {
      this.logger.error(`Failed to get usage for user ${userId}: ${error.message}`);
      return { used: 0, ttl: 0 };
    }
  }
}