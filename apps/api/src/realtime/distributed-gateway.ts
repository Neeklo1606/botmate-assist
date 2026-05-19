import type { RealtimeGateway } from "./gateway-types.js";
import type { RedisBackedRealtimePubSub } from "./redis-pubsub-boundary.js";
import { redisChannelForRoom, roomFromRedisChannel } from "./redis-realtime-pubsub.js";
import {
  bumpRealtimePublishTotal,
  bumpRedisInboundForwarded,
  bumpRedisPoisonDropped,
  bumpRealtimeTracingEmitted,
} from "./realtime-metrics.js";

const TENANT_ROOM = /^tenant:([^:]+)(:|$)/;

function tenantIdFromRoom(room: string): string | null {
  const match = TENANT_ROOM.exec(room);
  return match?.[1] ?? null;
}

/** Validates inbound Redis frames — prevents cross-tenant poisoning if Redis ACL misconfigured. */
function isReplaySafeRoom(room: string): boolean {
  return room.startsWith("tenant:") && room.length <= 512;
}

/**
 * Layered gateway: memory fan-out stays hot-path local; Redis mirrors envelopes for horizontal scale.
 * `workspaceId` ≡ tenant id (see REALTIME_ARCHITECTURE.md).
 */
export function createDistributedRealtimeGateway(
  memory: RealtimeGateway,
  redis: RedisBackedRealtimePubSub | null,
): RealtimeGateway {
  if (!redis) {
    return memory;
  }

  const bridge = redis;

  let teardown: (() => Promise<void>) | null = null;
  let started = false;

  async function ensureFanIn(): Promise<void> {
    if (started) return;
    started = true;
    const unsub = await bridge.subscribeFanout(async (channel, payload) => {
      bumpRedisInboundForwarded();
      bumpRealtimeTracingEmitted();
      const room = roomFromRedisChannel(channel);
      if (!room || !isReplaySafeRoom(room)) {
        bumpRedisPoisonDropped();
        return;
      }
      const tenantId = tenantIdFromRoom(room);
      if (!tenantId) {
        bumpRedisPoisonDropped();
        return;
      }
      await memory.publish(tenantId, room, payload);
    });
    teardown = unsub;
  }

  void ensureFanIn().catch((err) => {
    console.error("[realtime] redis fan-in bootstrap failed", err);
  });

  return {
    subscribe(workspaceId, channels, sink) {
      return memory.subscribe(workspaceId, channels, sink);
    },
    async publish(workspaceId, channel, payload) {
      bumpRealtimePublishTotal();
      bumpRealtimeTracingEmitted();
      await memory.publish(workspaceId, channel, payload);
      const redisChannel = redisChannelForRoom(channel);
      await bridge.publish(redisChannel, payload);
    },
    disposeDistributedTransport: async () => {
      if (teardown) {
        await teardown();
        teardown = null;
      }
      started = false;
      await bridge.shutdown();
    },
  };
}
