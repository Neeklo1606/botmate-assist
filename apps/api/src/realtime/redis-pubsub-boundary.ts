/**
 * Horizontal scaling boundary — Redis pub/sub adapter contract (Phase 3B).
 * Dual-connection fan-out mirrors canonical gateway rooms verbatim (`tenant:*`).
 */
export type RealtimePubSubUnsubscribe = () => Promise<void>;

export interface RealtimePubSubPort {
  publish(channel: string, payload: string): Promise<void>;
  subscribe(channels: string[], handler: (channel: string, payload: string) => void): Promise<RealtimePubSubUnsubscribe>;
}

export interface RedisBackedRealtimePubSub extends RealtimePubSubPort {
  /** PSUBSCRIBE every realtime room without maintaining explicit channel lists on each pod. */
  subscribeFanout(handler: (channel: string, payload: string) => void): Promise<RealtimePubSubUnsubscribe>;
  shutdown(): Promise<void>;
  reconnectSnapshot(): number;
}
