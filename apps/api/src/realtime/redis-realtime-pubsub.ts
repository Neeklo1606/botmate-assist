import Redis from "ioredis";
import type { RealtimePubSubUnsubscribe, RedisBackedRealtimePubSub } from "./redis-pubsub-boundary.js";
import {
  bumpRedisPublishFail,
  bumpRedisPublishOk,
  bumpRedisReconnect,
  recordRedisPublishLatencyMs,
} from "./realtime-metrics.js";

/** Prefix isolates realtime channels from BullMQ (`q:*`) and ad-hoc keys. */
export const REALTIME_REDIS_PREFIX = "bm:rt:v1:";

export function redisChannelForRoom(roomId: string): string {
  return `${REALTIME_REDIS_PREFIX}${roomId}`;
}

export function roomFromRedisChannel(channel: string): string | null {
  if (!channel.startsWith(REALTIME_REDIS_PREFIX)) return null;
  return channel.slice(REALTIME_REDIS_PREFIX.length);
}

const FANOUT_PATTERN = `${REALTIME_REDIS_PREFIX}*`;

/**
 * Duplicate Redis connections — pub/sub subscribers cannot issue normal commands on same socket.
 * https://redis.io/docs/manual/pubsub/
 */
export function createRedisBackedRealtimePubSub(
  url: string,
  hooks?: { logger?: Pick<Console, "warn" | "error"> },
): RedisBackedRealtimePubSub {
  let reconnectCount = 0;
  const logger = hooks?.logger ?? console;

  const publisher = new Redis(url, {
    enableOfflineQueue: true,
    maxRetriesPerRequest: 80,
    retryStrategy(times: number) {
      return Math.min(times * 150, 7500);
    },
  });

  publisher.on("reconnecting", () => {
    reconnectCount++;
    bumpRedisReconnect();
  });

  const subscriber = new Redis(url, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: null,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 9000);
      logger.warn?.(`[realtime/redis] subscriber reconnect scheduled delay=${delay}ms`);
      return delay;
    },
  });

  subscriber.on("reconnecting", () => {
    reconnectCount++;
    bumpRedisReconnect();
  });

  let fanoutHandler: ((channel: string, payload: string) => void) | null = null;
  let pmessageBound = false;

  function ensurePmessageBridge(): void {
    if (pmessageBound) return;
    pmessageBound = true;
    subscriber.on("pmessage", (_pattern: string, channel: string, message: string | Buffer) => {
      if (!fanoutHandler) return;
      const payload = typeof message === "string" ? message : message.toString("utf8");
      fanoutHandler(channel, payload);
    });
  }

  async function subscribeFanout(handler: (channel: string, payload: string) => void): Promise<RealtimePubSubUnsubscribe> {
    fanoutHandler = handler;
    ensurePmessageBridge();
    if (subscriber.status !== "ready") {
      await subscriber.connect();
    }
    await subscriber.psubscribe(FANOUT_PATTERN);
    return async () => {
      fanoutHandler = null;
      await subscriber.punsubscribe(FANOUT_PATTERN).catch(() => undefined);
    };
  }

  async function subscribe(
    channels: string[],
    handler: (channel: string, payload: string) => void,
  ): Promise<RealtimePubSubUnsubscribe> {
    if (!channels.length) {
      return async () => undefined;
    }
    ensurePmessageBridge();
    await subscriber.subscribe(...channels);
    const localHandler = (channel: string, message: string | Buffer) => {
      const payload = typeof message === "string" ? message : message.toString("utf8");
      handler(channel, payload);
    };
    subscriber.on("message", localHandler);
    return async () => {
      subscriber.off("message", localHandler);
      await subscriber.unsubscribe(...channels).catch(() => undefined);
    };
  }

  async function publish(channel: string, payload: string): Promise<void> {
    const started = Date.now();
    try {
      await publisher.publish(channel, payload);
      bumpRedisPublishOk();
      recordRedisPublishLatencyMs(Date.now() - started);
    } catch (err) {
      bumpRedisPublishFail();
      throw err;
    }
  }

  async function shutdown(): Promise<void> {
    fanoutHandler = null;
    await subscriber.punsubscribe(FANOUT_PATTERN).catch(() => undefined);
    subscriber.disconnect(false);
    await publisher.quit().catch(() => undefined);
  }

  const port: RedisBackedRealtimePubSub = {
    publish,
    subscribe,
    subscribeFanout,
    shutdown,
    reconnectSnapshot: () => reconnectCount,
  };

  return port;
}

export async function probeRedisUrl(url: string): Promise<boolean> {
  const probe = new Redis(url, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 1500,
  });
  try {
    await probe.connect();
    const pong = await probe.ping();
    return pong === "PONG";
  } catch {
    return false;
  } finally {
    probe.disconnect(false);
  }
}

export function createRealtimePubSubFromEnv(): RedisBackedRealtimePubSub | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url || process.env.BOTMATE_REDIS_DISABLED === "true") {
    return null;
  }
  return createRedisBackedRealtimePubSub(url);
}
