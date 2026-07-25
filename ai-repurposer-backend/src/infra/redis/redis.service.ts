// src/redis/redis.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    });
  }

  onModuleDestroy() {
    this.client.quit();
  }

  async increment(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async decrement(key: string): Promise<number> {
    return this.client.decr(key);
  }

  /** Runs a Lua script server-side so multi-step updates stay atomic. */
  async eval(
    script: string,
    keys: string[],
    args: (string | number)[],
  ): Promise<unknown> {
    return this.client.eval(script, keys.length, ...keys, ...args);
  }

  async expireAt(key: string, date: Date): Promise<void> {
    const ttl = Math.floor((date.getTime() - Date.now()) / 1000);
    if (ttl > 0) await this.client.expire(key, ttl);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }
}
