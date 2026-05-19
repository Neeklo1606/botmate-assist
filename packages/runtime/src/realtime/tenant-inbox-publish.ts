import { RealtimeEnvelopeSchema, type RealtimeEventName } from "@botmate/shared";
import { publishGovernedRealtimeToRooms } from "./governed-realtime-publish.js";

const REALTIME_REDIS_PREFIX = "bm:rt:v1:";

export function tenantInboxRoom(tenantId: string): string {
  return `tenant:${tenantId}:inbox`;
}

/** Canonical lifecycle payload keys — envelopes remain `record<string,unknown>` on the wire. */
export function executionLifecyclePayload(input: {
  traceId: string;
  executionId: string;
  correlationId?: string | undefined;
  policyDecision?: string | undefined;
  replayTier?: string | undefined;
  runtimeSurface: string;
  extra?: Record<string, unknown> | undefined;
}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    traceId: input.traceId,
    executionId: input.executionId,
    runtimeSurface: input.runtimeSurface,
  };
  if (input.correlationId !== undefined && input.correlationId.trim()) base.correlationId = input.correlationId;
  if (input.policyDecision !== undefined && input.policyDecision.trim()) base.policyDecision = input.policyDecision;
  if (input.replayTier !== undefined && input.replayTier.trim()) base.replayTier = input.replayTier;
  if (input.extra && Object.keys(input.extra).length > 0) Object.assign(base, input.extra);
  return base;
}

/** Redis fan-out matching notifications dispatch (`bm:rt:v1:tenant:{id}:inbox`). */
export async function publishTenantInboxEnvelope(input: {
  publishRedis: (fullRedisChannel: string, wireJson: string) => Promise<void>;
  tenantId: string;
  event: RealtimeEventName;
  payload: Record<string, unknown>;
  governanceSurfaceId?: string | undefined;
}): Promise<void> {
  const envelope = RealtimeEnvelopeSchema.parse({
    v: 1,
    tenantId: input.tenantId,
    ts: new Date().toISOString(),
    event: input.event,
    payload: input.payload,
  });
  await publishGovernedRealtimeToRooms({
    gateway: {
      publish: async (_tenantId: string, room: string, wire: string) => {
        const channel = `${REALTIME_REDIS_PREFIX}${room}`;
        await input.publishRedis(channel, wire);
      },
    },
    publishTenantId: input.tenantId,
    rooms: [tenantInboxRoom(input.tenantId)],
    envelope,
    wireMode: "event_frame",
    governanceSurfaceId: input.governanceSurfaceId ?? "surface.worker.runtime.tenant_inbox",
  });
}
