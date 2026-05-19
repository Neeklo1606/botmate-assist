import type { RealtimeGateway, RealtimeSocketSink } from "./gateway-types.js";

type ChannelKey = string;

function channelKey(workspaceId: string, channel: string): ChannelKey {
  return `${workspaceId}\u001f${channel}`;
}

/** Single-process fan-out; horizontally scalable via Redis adapter boundary (see redis-pubsub-boundary.ts). */
export function createMemoryRealtimeGateway(): RealtimeGateway {
  const map = new Map<ChannelKey, Map<string, RealtimeSocketSink>>();

  function subscribe(workspaceId: string, channels: string[], sink: RealtimeSocketSink): () => void {
    const keys: ChannelKey[] = [];
    for (const ch of channels) {
      const k = channelKey(workspaceId, ch);
      keys.push(k);
      let bucket = map.get(k);
      if (!bucket) {
        bucket = new Map();
        map.set(k, bucket);
      }
      bucket.set(sink.id, sink);
    }

    return () => {
      for (const k of keys) {
        const bucket = map.get(k);
        if (!bucket) continue;
        bucket.delete(sink.id);
        if (bucket.size === 0) map.delete(k);
      }
    };
  }

  async function publish(workspaceId: string, channel: string, payload: string): Promise<void> {
    const k = channelKey(workspaceId, channel);
    const bucket = map.get(k);
    if (!bucket || bucket.size === 0) return;
    const sinks = [...bucket.values()];
    for (const s of sinks) {
      try {
        s.send(payload);
      } catch {
        bucket.delete(s.id);
      }
    }
    if (bucket.size === 0) map.delete(k);
  }

  return { subscribe, publish };
}
