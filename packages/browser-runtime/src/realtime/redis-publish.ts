import type Redis from "ioredis";
import { REALTIME_REDIS_PREFIX } from "./redis-channel.js";

export function redisChannelForRoom(roomId: string): string {
  return `${REALTIME_REDIS_PREFIX}${roomId}`;
}

export async function publishRawRealtimePayload(redis: Redis, roomId: string, wireJson: string): Promise<void> {
  await redis.publish(redisChannelForRoom(roomId), wireJson);
}
