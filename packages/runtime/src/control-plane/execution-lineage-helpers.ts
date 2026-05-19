import {
  ExecutionLineageAttachmentSchema,
  type ExecutionLineageAttachment,
} from "@botmate/shared";
import { createExecutionIdentity } from "./execution-identity.js";

export function normalizeExecutionLineageAttachment(input: unknown): ExecutionLineageAttachment | undefined {
  const r = ExecutionLineageAttachmentSchema.safeParse(input);
  return r.success ? r.data : undefined;
}

/** Merge blob + legacy top-level correlation fields present on queue payloads. */
export function extractEffectiveExecutionLineage(payload: Record<string, unknown>): ExecutionLineageAttachment {
  const blob = normalizeExecutionLineageAttachment(payload.executionLineage);
  const traceId =
    blob?.traceId?.trim() ||
    (typeof payload.traceId === "string" && payload.traceId.trim() ? payload.traceId.trim() : undefined);
  const correlationId =
    blob?.correlationId?.trim() ||
    (typeof payload.correlationId === "string" && payload.correlationId.trim()
      ? payload.correlationId.trim()
      : undefined);
  const executionId =
    blob?.executionId?.trim() ||
    (typeof payload.executionId === "string" && payload.executionId.trim()
      ? payload.executionId.trim()
      : undefined);
  const causationId = blob?.causationId?.trim() || undefined;
  const replayOriginExecutionId = blob?.replayOriginExecutionId?.trim() || undefined;
  const actorId = blob?.actorId?.trim() || undefined;
  return ExecutionLineageAttachmentSchema.parse({
    ...(blob ?? {}),
    traceId,
    correlationId,
    executionId,
    causationId,
    replayOriginExecutionId,
    actorId,
  });
}

export function hasMinimalExecutionLineage(eff: ExecutionLineageAttachment): boolean {
  return Boolean(eff.traceId?.trim() || eff.correlationId?.trim() || eff.executionId?.trim());
}

export function inheritExecutionIdentity<T extends Record<string, unknown>>(
  payload: T,
  parent?: ExecutionLineageAttachment | null,
): T & { executionLineage?: ExecutionLineageAttachment } {
  const existing = normalizeExecutionLineageAttachment(payload.executionLineage);
  const p = parent ?? undefined;
  if (!p && !existing) return payload as T & { executionLineage?: ExecutionLineageAttachment };
  const merged = ExecutionLineageAttachmentSchema.parse({
    ...p,
    ...existing,
  });
  return { ...payload, executionLineage: merged };
}

/**
 * Prefer inherited lineage / payload fallbacks — mint **`correlationId`/`traceId`/`executionId`** when absent.
 */
export function mergeExecutionContextSafe<T extends Record<string, unknown>>(
  payload: T,
  opts?: { parentLineage?: ExecutionLineageAttachment | null },
): T & { executionLineage: ExecutionLineageAttachment } {
  const withInherited = inheritExecutionIdentity(payload, opts?.parentLineage ?? null);
  const flat = extractEffectiveExecutionLineage(withInherited as Record<string, unknown>);
  if (hasMinimalExecutionLineage(flat)) {
    const blob = ExecutionLineageAttachmentSchema.parse({
      ...flat,
      ...normalizeExecutionLineageAttachment(withInherited.executionLineage),
    });
    return { ...payload, executionLineage: blob };
  }
  const mint = createExecutionIdentity();
  const blob = ExecutionLineageAttachmentSchema.parse({
    correlationId: mint.correlationId,
    traceId: mint.traceId,
    executionId: mint.executionId,
    ...normalizeExecutionLineageAttachment(withInherited.executionLineage),
  });
  return { ...payload, executionLineage: blob };
}

export function ensureExecutionLineage(payload: Record<string, unknown>): {
  ok: boolean;
  missing: string[];
  effective: ExecutionLineageAttachment;
} {
  const effective = extractEffectiveExecutionLineage(payload);
  const missing: string[] = [];
  if (!hasMinimalExecutionLineage(effective)) missing.push("traceId|correlationId|executionId");
  return { ok: missing.length === 0, missing, effective };
}
