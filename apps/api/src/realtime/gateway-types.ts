import type { RealtimeEnvelope } from "@botmate/shared";
import { realtimeEventWirePayload } from "@botmate/shared";

/**
 * Minimal gateway surface from REALTIME_PREPARATION.md — extended with typed envelopes + sinks.
 * `workspaceId` ≡ tenant id for Botmate workspace isolation.
 */
export interface RealtimeSocketSink {
  readonly id: string;
  send(rawText: string): void;
}

export interface RealtimeGateway {
  subscribe(workspaceId: string, channels: string[], sink: RealtimeSocketSink): () => void;
  publish(workspaceId: string, channel: string, payload: string): Promise<void>;
  /** Phase 3B — Redis PSUBSCRIBE teardown + socket drain (memory gateway ignores). */
  disposeDistributedTransport?: () => Promise<void>;
}

export function envelopeWirePayload(envelope: RealtimeEnvelope): string {
  return realtimeEventWirePayload(envelope);
}
