import Redis, { type RedisOptions } from "ioredis";

/** BullMQ-compatible Redis connection (workers / queues). */
export function createBullRedis(url: string): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

/** General-purpose Redis client for pub/sub adapters (API tier). */
export function createRedisClient(url: string, overrides?: RedisOptions): Redis {
  return new Redis(url, {
    lazyConnect: false,
    enableOfflineQueue: true,
    maxRetriesPerRequest: 50,
    retryStrategy(times: number) {
      return Math.min(times * 150, 7500);
    },
    ...overrides,
  });
}
