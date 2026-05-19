/**
 * Phase 11B — bounded retention helpers (explicit opt-in purge; no autonomous repair).
 */
import type { PrismaClient } from "@botmate/database";

export const RUNTIME_ACTIVITY_FACT_DEFAULT_TTL_MS = 30 * 86_400_000;

export const RUNTIME_GOVERNANCE_AUDIT_RETENTION_DAYS = Number(
  process.env.RUNTIME_GOVERNANCE_AUDIT_RETENTION_DAYS ?? "90",
);

export const RUNTIME_ACTIVITY_FACT_PURGE_BATCH = Number(
  process.env.RUNTIME_ACTIVITY_FACT_PURGE_BATCH ?? "500",
);

export const RUNTIME_EXECUTION_FACT_RETENTION_DAYS = Number(
  process.env.RUNTIME_EXECUTION_FACT_RETENTION_DAYS ?? "180",
);

export const RUNTIME_EXECUTION_FACT_PURGE_BATCH = Number(
  process.env.RUNTIME_EXECUTION_FACT_PURGE_BATCH ?? "500",
);

/** Delete activity facts past `expiresAt` — safe to call from reconcile/cleanup jobs. */
export async function purgeExpiredRuntimeActivityFacts(
  prisma: PrismaClient,
  input?: { tenantId?: string; batchSize?: number },
): Promise<{ deleted: number }> {
  const batch = Math.min(5000, Math.max(1, input?.batchSize ?? RUNTIME_ACTIVITY_FACT_PURGE_BATCH));
  const now = new Date();
  const rows = await prisma.runtimeActivityFact.findMany({
    where: {
      ...(input?.tenantId ? { tenantId: input.tenantId } : {}),
      expiresAt: { not: null, lt: now },
    },
    select: { id: true },
    take: batch,
    orderBy: { expiresAt: "asc" },
  });
  if (rows.length === 0) return { deleted: 0 };
  const result = await prisma.runtimeActivityFact.deleteMany({
    where: { id: { in: rows.map((r) => r.id) } },
  });
  return { deleted: result.count };
}

/**
 * Optional governance audit trim — only when `RUNTIME_GOVERNANCE_AUDIT_PURGE_ENABLED=true`.
 * Uses `createdAt` on `RuntimeGovernanceAuditEvent` (no TTL column on row).
 */
export async function purgeStaleGovernanceAuditEvents(
  prisma: PrismaClient,
  input?: { tenantId?: string; batchSize?: number },
): Promise<{ deleted: number }> {
  if (process.env.RUNTIME_GOVERNANCE_AUDIT_PURGE_ENABLED?.trim() !== "true") {
    return { deleted: 0 };
  }
  const days = Math.min(3660, Math.max(7, RUNTIME_GOVERNANCE_AUDIT_RETENTION_DAYS));
  const cutoff = new Date(Date.now() - days * 86_400_000);
  const batch = Math.min(5000, Math.max(1, input?.batchSize ?? 500));
  const rows = await prisma.runtimeGovernanceAuditEvent.findMany({
    where: {
      ...(input?.tenantId ? { tenantId: input.tenantId } : {}),
      createdAt: { lt: cutoff },
    },
    select: { id: true },
    take: batch,
    orderBy: { createdAt: "asc" },
  });
  if (rows.length === 0) return { deleted: 0 };
  const result = await prisma.runtimeGovernanceAuditEvent.deleteMany({
    where: { id: { in: rows.map((r) => r.id) } },
  });
  return { deleted: result.count };
}

/**
 * Optional `ExecutionFact` trim — only when `RUNTIME_EXECUTION_FACT_PURGE_ENABLED=true`.
 * Uses `createdAt` (no TTL column on row).
 */
export async function purgeStaleExecutionFacts(
  prisma: PrismaClient,
  input?: { tenantId?: string; batchSize?: number },
): Promise<{ deleted: number }> {
  if (process.env.RUNTIME_EXECUTION_FACT_PURGE_ENABLED?.trim() !== "true") {
    return { deleted: 0 };
  }
  const days = Math.min(3660, Math.max(30, RUNTIME_EXECUTION_FACT_RETENTION_DAYS));
  const cutoff = new Date(Date.now() - days * 86_400_000);
  const batch = Math.min(5000, Math.max(1, input?.batchSize ?? RUNTIME_EXECUTION_FACT_PURGE_BATCH));
  const rows = await prisma.executionFact.findMany({
    where: {
      ...(input?.tenantId ? { tenantId: input.tenantId } : {}),
      createdAt: { lt: cutoff },
    },
    select: { id: true },
    take: batch,
    orderBy: { createdAt: "asc" },
  });
  if (rows.length === 0) return { deleted: 0 };
  const result = await prisma.executionFact.deleteMany({
    where: { id: { in: rows.map((r) => r.id) } },
  });
  return { deleted: result.count };
}
