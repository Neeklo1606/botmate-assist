import type { RealtimeEnvelope, RealtimeEventName } from "@botmate/shared";
import { RealtimeEnvelopeSchema } from "@botmate/shared";
import { publishGovernedRealtimeToRooms } from "@botmate/runtime";
import type { RealtimeGateway } from "./gateway-types.js";
import { getRealtimeGateway } from "./gateway-registry.js";
import {
  assistantRoom,
  chatSessionRoom,
  inboxRoom,
  leadsBoardRoom,
} from "./rooms.js";

function buildEnvelope(tenantId: string, event: RealtimeEventName, payload: Record<string, unknown>): RealtimeEnvelope {
  return RealtimeEnvelopeSchema.parse({
    v: 1,
    tenantId,
    ts: new Date().toISOString(),
    event,
    payload,
  });
}

async function publishToRooms(gateway: RealtimeGateway, tenantId: string, rooms: string[], envelope: RealtimeEnvelope) {
  await publishGovernedRealtimeToRooms({
    gateway,
    publishTenantId: tenantId,
    rooms,
    envelope,
    wireMode: "event_frame",
    governanceSurfaceId: "surface.realtime.workspace_fanout",
  });
}

export function realtimeFire(fn: () => Promise<void>): void {
  void fn().catch((err) => {
    console.error("[realtime] publish failed", err);
  });
}

export function emitMessageCreated(
  tenantId: string,
  sessionId: string,
  messageId: string,
  extra: Record<string, unknown> = {},
): void {
  realtimeFire(async () => {
    const gw = getRealtimeGateway();
    const env = buildEnvelope(tenantId, "message.created", { sessionId, messageId, ...extra });
    await publishToRooms(gw, tenantId, [chatSessionRoom(tenantId, sessionId), inboxRoom(tenantId)], env);
  });
}

/** Delivery / metadata terminal signals without new inserts (partial SSE rows, future PATCH). */
export function emitMessageUpdated(
  tenantId: string,
  sessionId: string,
  messageId: string,
  patch: Record<string, unknown>,
): void {
  realtimeFire(async () => {
    const gw = getRealtimeGateway();
    const env = buildEnvelope(tenantId, "message.updated", { sessionId, messageId, ...patch });
    await publishToRooms(gw, tenantId, [chatSessionRoom(tenantId, sessionId), inboxRoom(tenantId)], env);
  });
}

export function emitSessionUpdated(tenantId: string, sessionId: string, extra: Record<string, unknown> = {}): void {
  realtimeFire(async () => {
    const gw = getRealtimeGateway();
    const env = buildEnvelope(tenantId, "session.updated", { sessionId, ...extra });
    await publishToRooms(gw, tenantId, [chatSessionRoom(tenantId, sessionId), inboxRoom(tenantId)], env);
  });
}

export function emitLeadUpdated(tenantId: string, leadId: string, extra: Record<string, unknown> = {}): void {
  realtimeFire(async () => {
    const gw = getRealtimeGateway();
    const env = buildEnvelope(tenantId, "lead.updated", { leadId, ...extra });
    await publishToRooms(gw, tenantId, [leadsBoardRoom(tenantId), inboxRoom(tenantId)], env);
  });
}

export function emitAssistantUpdated(tenantId: string, assistantId: string, extra: Record<string, unknown> = {}): void {
  realtimeFire(async () => {
    const gw = getRealtimeGateway();
    const env = buildEnvelope(tenantId, "assistant.updated", { assistantId, ...extra });
    await publishToRooms(gw, tenantId, [assistantRoom(tenantId, assistantId), inboxRoom(tenantId)], env);
  });
}
