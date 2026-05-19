import {
  EffectivePolicySnapshotSchema,
  PolicyJobContextSchema,
  createPhase8dLegacyEffectivePolicySnapshot,
  type EffectivePolicySnapshot,
  type PolicyJobContext,
} from "@botmate/shared";
import { bumpLegacyPolicySnapshotMint } from "../production/production-metrics.js";

const DEFAULT_SNAPSHOT_ID = "phase8e-runtime-snapshot-v1";

/**
 * Synthetic tenant scope for global hygiene jobs (`browser.cleanup` / `artifact.cleanup`)
 * when payloads omit `tenantId` — keeps **`PolicyEvaluationContext`** valid without implying a customer tenant row.
 */
export const POLICY_SYSTEM_SCOPE_TENANT_ID = "__policy_system_scope__";

/** Single-process epoch — mint WS tickets & validate upgrades (`BOTMATE_RUNTIME_POLICY_EPOCH`). */
export function readRuntimePolicyEpoch(): number {
  const raw = process.env.BOTMATE_RUNTIME_POLICY_EPOCH?.trim();
  const n = raw !== undefined && raw !== "" ? Number(raw) : 0;
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

function baseSnapshotId(): string {
  return process.env.BOTMATE_POLICY_SNAPSHOT_ID?.trim() || DEFAULT_SNAPSHOT_ID;
}

/**
 * Producer bundle for queue payloads — snapshot row and `policyContext` stay consistent.
 */
function mintLegacySnapshot(
  overrides?: Parameters<typeof createPhase8dLegacyEffectivePolicySnapshot>[0],
): ReturnType<typeof createPhase8dLegacyEffectivePolicySnapshot> {
  bumpLegacyPolicySnapshotMint();
  return createPhase8dLegacyEffectivePolicySnapshot(overrides);
}

export function createRuntimePolicyJobContext(): PolicyJobContext {
  const epoch = readRuntimePolicyEpoch();
  const snap = mintLegacySnapshot({
    snapshotId: baseSnapshotId(),
    freezeGeneration: epoch,
  });
  return PolicyJobContextSchema.parse({
    snapshotId: snap.snapshotId,
    snapshotHash: snap.snapshotHash,
    freezeGeneration: snap.freezeGeneration,
  });
}

/** Normalize unknown/partial producer input — invalid shapes yield `undefined` (backward compatible). */
export function normalizePolicySnapshot(input: unknown): PolicyJobContext | undefined {
  const parsed = PolicyJobContextSchema.safeParse(input);
  return parsed.success ? parsed.data : undefined;
}

export function inheritPolicyContext<T extends Record<string, unknown>>(
  payload: T,
  parentPolicy?: PolicyJobContext | null,
): T & { policyContext?: PolicyJobContext } {
  const normalizedExisting = normalizePolicySnapshot((payload as { policyContext?: unknown }).policyContext);
  if (normalizedExisting) return { ...payload, policyContext: normalizedExisting };
  if (!parentPolicy) return payload as T & { policyContext?: PolicyJobContext };
  return { ...payload, policyContext: parentPolicy };
}

/**
 * Prefer inherited **`policyContext`** from chained producers; otherwise mint fresh runtime context.
 * Never throws on malformed inherited blobs — drops invalid inherited rows before minting fresh context.
 */
export function mergePolicyContextSafe<T extends Record<string, unknown>>(
  payload: T,
  opts?: { parentPolicy?: PolicyJobContext | null },
): T & { policyContext: PolicyJobContext } {
  const inherited = inheritPolicyContext(payload, opts?.parentPolicy ?? null);
  const normalized = normalizePolicySnapshot(inherited.policyContext);
  if (normalized) return { ...payload, policyContext: normalized };
  return mergePolicyContext(payload);
}

/** Rebuild authoritative snapshot at worker — same defaults as producer when `policyContext` omitted. */
export function resolveEffectiveSnapshotFromJobPayload(
  policyContext?: PolicyJobContext | null,
): EffectivePolicySnapshot {
  if (!policyContext) {
    return mintLegacySnapshot({
      snapshotId: baseSnapshotId(),
      freezeGeneration: 0,
    });
  }
  const defaults = mintLegacySnapshot({
    snapshotId: baseSnapshotId(),
    freezeGeneration: policyContext.freezeGeneration,
  });
  return EffectivePolicySnapshotSchema.parse({
    ...defaults,
    snapshotId: policyContext.snapshotId,
    snapshotHash: policyContext.snapshotHash,
    freezeGeneration: policyContext.freezeGeneration,
  });
}

export function mergePolicyContext<T extends Record<string, unknown>>(payload: T): T & { policyContext: PolicyJobContext } {
  return { ...payload, policyContext: createRuntimePolicyJobContext() };
}
