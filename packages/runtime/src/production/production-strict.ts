/**
 * Phase 11B — opt-in production strict mode (no behavior change unless explicitly enabled).
 *
 * Enable: `BOTMATE_PRODUCTION_STRICT=true`
 * Related: `BOTMATE_WORKER_REJECT_STUB=true`, `BOTMATE_REALTIME_EVENT_FRAME=true`
 */

export function isProductionStrictMode(): boolean {
  const raw = process.env.BOTMATE_PRODUCTION_STRICT?.trim().toLowerCase();
  return raw === "true" || raw === "1";
}

/** When true, missing BullMQ processors fail the job instead of `stubOk` (intentional stub queues exempt). */
export function shouldRejectWorkerStubCompletions(): boolean {
  const raw = process.env.BOTMATE_WORKER_REJECT_STUB?.trim().toLowerCase();
  if (raw === "true" || raw === "1") return true;
  return isProductionStrictMode();
}

/** Prefer canonical governed wire format over legacy raw JSON envelope. */
export function preferredGovernedRealtimeWireMode(): "event_frame" | "raw_envelope" {
  const raw = process.env.BOTMATE_REALTIME_EVENT_FRAME?.trim().toLowerCase();
  if (raw === "false" || raw === "0") return "raw_envelope";
  if (raw === "true" || raw === "1") return "event_frame";
  return isProductionStrictMode() ? "event_frame" : "raw_envelope";
}

/** Block cross-tenant realtime fan-out when strict (default warn-only). */
export function shouldBlockRealtimeTenantMismatch(): boolean {
  if (isProductionStrictMode()) return true;
  const raw = process.env.BOTMATE_REALTIME_BLOCK_TENANT_MISMATCH?.trim().toLowerCase();
  return raw === "true" || raw === "1";
}

/** Require MCP calls to pass `policy.tenantId` (no warn-only path). */
export function requireMcpPolicyContext(): boolean {
  if (isProductionStrictMode()) return true;
  const raw = process.env.BOTMATE_MCP_REQUIRE_POLICY_CONTEXT?.trim().toLowerCase();
  return raw === "true" || raw === "1";
}

/** Forbid `CONTROL_PLANE_GOVERNANCE_ENABLED=false` bypass. */
export function forbidControlPlaneGovernanceBypass(): boolean {
  return isProductionStrictMode();
}
