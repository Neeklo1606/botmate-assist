/** Lightweight counters for `/health/realtime` — swap for Prometheus/OpenTelemetry exporters later. */

const metrics = {
  wsConnectionsOpened: 0,
  wsConnectionsClosed: 0,
  wsBrowserFeedSubscribeRejected: 0,
  realtimePublishTotal: 0,
  redisPublishOk: 0,
  redisPublishFail: 0,
  redisReconnect: 0,
  redisInboundForwarded: 0,
  redisPoisonDropped: 0,
  realtimeTracingEmitted: 0,
};

const latencyRing: number[] = [];
const LATENCY_RING_CAP = 200;

export function bumpWsOpened(): void {
  metrics.wsConnectionsOpened++;
}

export function bumpWsClosed(): void {
  metrics.wsConnectionsClosed++;
}

export function bumpBrowserFeedWsSubscribeRejected(): void {
  metrics.wsBrowserFeedSubscribeRejected++;
}

export function bumpRealtimePublishTotal(): void {
  metrics.realtimePublishTotal++;
}

export function bumpRedisPublishOk(): void {
  metrics.redisPublishOk++;
}

export function bumpRedisPublishFail(): void {
  metrics.redisPublishFail++;
}

export function bumpRedisReconnect(): void {
  metrics.redisReconnect++;
}

export function bumpRedisInboundForwarded(): void {
  metrics.redisInboundForwarded++;
}

export function bumpRedisPoisonDropped(): void {
  metrics.redisPoisonDropped++;
}

export function bumpRealtimeTracingEmitted(): void {
  metrics.realtimeTracingEmitted++;
}

export function recordRedisPublishLatencyMs(ms: number): void {
  latencyRing.push(ms);
  if (latencyRing.length > LATENCY_RING_CAP) {
    latencyRing.splice(0, latencyRing.length - LATENCY_RING_CAP);
  }
}

function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
  return sorted[idx] ?? null;
}

export function getRealtimeMetricsSnapshot(): Record<string, unknown> {
  const sorted = [...latencyRing].sort((a, b) => a - b);
  return {
    ...metrics,
    redisPublishLatencyMsSampleCount: latencyRing.length,
    redisPublishLatencyMsApproxP95: percentile(sorted, 0.95),
    redisPublishLatencyMsApproxP99: percentile(sorted, 0.99),
  };
}
