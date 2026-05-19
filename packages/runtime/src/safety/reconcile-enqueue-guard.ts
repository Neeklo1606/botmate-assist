import { bumpReconcileEnqueueCooldownSuppressed } from "./execution-safety-metrics.js";

const lastSuccessfulReconcileEnqueueByTenant = new Map<string, number>();

/** Default 60s per tenant between successful reconcile enqueue calls; clamp [0 disables, 3600s]. */
export function runtimeReconcileEnqueueCooldownMs(): number {
  const v = Number(process.env.RUNTIME_RECONCILE_ENQUEUE_COOLDOWN_MS ?? "60000");
  return Math.min(3_600_000, Math.max(0, Math.floor(v)));
}

/** Remaining millis before tenant may enqueue another reconcile job (`0` = allowed now). */
export function reconcileEnqueueCooldownRemainingMs(tenantId: string): number {
  const cooldown = runtimeReconcileEnqueueCooldownMs();
  if (cooldown <= 0) return 0;
  const tid = tenantId.trim();
  const prev = lastSuccessfulReconcileEnqueueByTenant.get(tid);
  if (prev === undefined) return 0;
  const elapsed = Date.now() - prev;
  return elapsed >= cooldown ? 0 : cooldown - elapsed;
}

/** Bump Phase 10D suppression counter — use when rejecting due to cooldown. */
export function recordReconcileEnqueueCooldownSuppressed(): void {
  bumpReconcileEnqueueCooldownSuppressed();
}

/** Call only after reconcile job enqueue succeeds — failures must not tighten cooldown window. */
export function recordSuccessfulReconcileEnqueue(tenantId: string): void {
  lastSuccessfulReconcileEnqueueByTenant.set(tenantId.trim(), Date.now());
}
