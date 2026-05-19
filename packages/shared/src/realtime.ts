import { z } from "zod";

/** Domain events emitted over realtime transports (WS Phase 3A+). */
export const RealtimeEventNameSchema = z.enum([
  "message.created",
  "message.updated",
  "lead.updated",
  "session.updated",
  "assistant.updated",
  "notification.created",
  "browser.step_started",
  "browser.step_completed",
  "browser.snapshot",
  "browser.error",
  "browser.feed_snapshot",
  "operator.joined",
  "operator.left",
  "operator.takeover",
  "operator.released",
  /** Phase 9F — execution lifecycle fan-out (tenant inbox; additive). */
  "execution.started",
  "execution.running",
  "execution.completed",
  "execution.failed",
  "execution.blocked",
  "execution.frozen",
  "execution.replayed",
  /** Bounded reconciliation summary (hints only). */
  "runtime.reconcile_hint",
]);

export type RealtimeEventName = z.infer<typeof RealtimeEventNameSchema>;

/** Wire envelope — versioned for forward-compatible clients. */
export const RealtimeEnvelopeSchema = z.object({
  v: z.literal(1),
  tenantId: z.string().min(1),
  ts: z.string().min(1),
  event: RealtimeEventNameSchema,
  /** Narrow keys documented in EVENT_MODEL.md; extensible record for payloads. */
  payload: z.record(z.string(), z.unknown()),
});

export type RealtimeEnvelope = z.infer<typeof RealtimeEnvelopeSchema>;

/** Canonical WS **`op:event`** wire — shared by API gateway + governance helpers (`REALTIME_GOVERNANCE_COMPLETION.md`). */
export function realtimeEventWirePayload(envelope: RealtimeEnvelope): string {
  return JSON.stringify({ op: "event" as const, envelope });
}

/** Client → gateway subscribe frame (workspace id = tenant id). */
export const RealtimeSubscribeOpSchema = z.object({
  op: z.literal("subscribe"),
  rooms: z.array(z.string()).min(1).max(48),
});

export const RealtimeUnsubscribeOpSchema = z.object({
  op: z.literal("unsubscribe"),
  rooms: z.array(z.string()).min(1).max(48),
});

/** Operator presence heartbeat (no persistence in Phase 3A). */
export const RealtimePresenceOpSchema = z.object({
  op: z.literal("presence"),
  kind: z.enum(["operator_online", "heartbeat", "viewer_ping"]),
  surface: z.enum(["chat", "leads", "cabinet"]).optional(),
  sessionId: z.string().optional(),
});

export const RealtimeClientToServerSchema = z.discriminatedUnion("op", [
  RealtimeSubscribeOpSchema,
  RealtimeUnsubscribeOpSchema,
  RealtimePresenceOpSchema,
]);

export type RealtimeClientToServer = z.infer<typeof RealtimeClientToServerSchema>;

export const RealtimeServerEventFrameSchema = z.object({
  op: z.literal("event"),
  envelope: RealtimeEnvelopeSchema,
});

export const RealtimeServerPresenceFrameSchema = z.object({
  op: z.literal("presence"),
  tenantId: z.string(),
  fromUserId: z.string(),
  kind: z.string(),
  surface: z.string().optional(),
  sessionId: z.string().optional(),
  ts: z.string(),
});

export const RealtimeServerAckSchema = z.object({
  op: z.literal("ack"),
  subscribedRooms: z.array(z.string()),
});

export const RealtimeServerErrorSchema = z.object({
  op: z.literal("error"),
  code: z.string(),
  message: z.string().optional(),
});
