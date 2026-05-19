import type { RealtimeEnvelope } from "@botmate/shared";
import { realtimeEventWirePayload } from "@botmate/shared";
import type { PolicyStructuredLogger } from "../policy/policy-metrics.js";
import { observeRealtimeEnvelopeGovernance } from "./envelope-governance.js";

/** Minimal publish port — implemented by **`RealtimeGateway`** and Redis adapters (`REALTIME_GOVERNANCE_COMPLETION.md`). */
export type GovernedRealtimePublishPort = {
  publish(workspaceId: string, channel: string, payload: string): Promise<void>;
};

export type GovernedRealtimeWireMode = "event_frame" | "raw_envelope";

/**
 * Central realtime publish helper — tenant governance + canonical **`event_frame`** or legacy **`raw_envelope`** wiring.
 */
export async function publishGovernedRealtimeToRooms(input: {
  gateway: GovernedRealtimePublishPort;
  publishTenantId: string;
  rooms: string[];
  envelope: RealtimeEnvelope;
  wireMode: GovernedRealtimeWireMode;
  governanceSurfaceId?: string;
  logger?: PolicyStructuredLogger;
}): Promise<void> {
  const governance = observeRealtimeEnvelopeGovernance({
    envelopeTenantId: input.envelope.tenantId,
    publishTenantId: input.publishTenantId,
    event: input.envelope.event,
    logger: input.logger,
    governanceSurfaceId: input.governanceSurfaceId,
  });
  if (governance.blocked) return;

  const wire =
    input.wireMode === "event_frame"
      ? realtimeEventWirePayload(input.envelope)
      : JSON.stringify(input.envelope);

  await Promise.all(input.rooms.map((room) => input.gateway.publish(input.publishTenantId, room, wire)));
}
