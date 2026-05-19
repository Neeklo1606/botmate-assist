import type { PrismaClient } from "@botmate/database";
import type { Prisma } from "@botmate/database";

function stuckThresholdMs(): number {
  const v = Number(process.env.RUNTIME_STUCK_THRESHOLD_MS ?? `${1_800_000}`);
  return Math.min(86_400_000, Math.max(120_000, Math.floor(v)));
}

/** Skip persisted governance writes (reads still work). */
function governanceAuditSyncDisabled(): boolean {
  return process.env.BOTMATE_RUNTIME_GOVERNANCE_AUDIT_SYNC?.trim() === "false";
}

const lastGovernanceSyncMsByTenant = new Map<string, number>();
const SYNC_INTERVAL_MS = 60_000;

export async function maybeSyncGovernanceAuditProjection(
  prisma: PrismaClient,
  tenantId: string,
): Promise<void> {
  if (governanceAuditSyncDisabled()) return;
  const now = Date.now();
  const prev = lastGovernanceSyncMsByTenant.get(tenantId) ?? 0;
  if (now - prev < SYNC_INTERVAL_MS) return;
  lastGovernanceSyncMsByTenant.set(tenantId, now);
  await syncGovernanceAuditProjection(prisma, tenantId);
}

export function governancePrimaryCodeFromFatal(fatal: string): string {
  const upper = fatal.toUpperCase();
  if (fatal.includes("OUTPUT_LIMIT")) return "POLICY_DENIED";
  if (upper.includes("FREEZE")) return "POLICY_FREEZE";
  if (upper.includes("CONTEXT") || upper.includes("STALE")) return "POLICY_CONTEXT_MISSING";
  return "POLICY_DENIED";
}

function metaFatal(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const fatal = (meta as { fatalError?: unknown }).fatalError;
  return typeof fatal === "string" && fatal.trim() ? fatal.trim() : null;
}

export async function syncGovernanceAuditProjection(prisma: PrismaClient, tenantId: string): Promise<void> {
  if (governanceAuditSyncDisabled()) return;

  const staleBefore = new Date(Date.now() - stuckThresholdMs());
  const sevenDays = new Date(Date.now() - 7 * 86_400_000);

  const [stuckTools, stuckBrowsers, fatalAssistantMessages] = await Promise.all([
    prisma.toolInvocation.findMany({
      where: {
        tenantId,
        status: "START",
        createdAt: { lt: staleBefore },
      },
      select: { id: true, toolName: true, sessionId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
    prisma.browserRun.findMany({
      where: {
        tenantId,
        status: "running",
        updatedAt: { lt: staleBefore },
      },
      select: { id: true, traceId: true, browserSessionId: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 120,
    }),
    prisma.message.findMany({
      where: {
        tenantId,
        role: "ASSISTANT",
        createdAt: { gte: sevenDays },
      },
      select: { id: true, sessionId: true, metadata: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 160,
    }),
  ]);

  const rows: Prisma.RuntimeGovernanceAuditEventCreateManyInput[] = [];

  for (const t of stuckTools) {
    rows.push({
      tenantId,
      dedupeKey: `gov:GOVERNANCE_LINEAGE_DRIFT:stuck_tool:${t.id}`,
      traceId: null,
      sessionId: t.sessionId,
      assistantId: null,
      code: "GOVERNANCE_LINEAGE_DRIFT",
      severity: "critical",
      message: `Tool invocation stuck in START beyond threshold (${t.toolName})`,
      surface: "governance",
      metadata: { toolInvocationId: t.id, signal: "stuck_tool_start" },
    });
    rows.push({
      tenantId,
      dedupeKey: `gov:POLICY_SNAPSHOT_STALE:stuck_tool:${t.id}`,
      traceId: null,
      sessionId: t.sessionId,
      assistantId: null,
      code: "POLICY_SNAPSHOT_STALE",
      severity: "warn",
      message: `Tool invocation stalled — snapshot/intermediate context likely stale (${t.toolName})`,
      surface: "policy",
      metadata: { toolInvocationId: t.id },
    });
  }

  for (const b of stuckBrowsers) {
    rows.push({
      tenantId,
      dedupeKey: `gov:GOVERNANCE_LINEAGE_DRIFT:stuck_browser:${b.id}`,
      traceId: b.traceId,
      sessionId: null,
      assistantId: null,
      code: "GOVERNANCE_LINEAGE_DRIFT",
      severity: "critical",
      message: "Browser run stuck in running beyond threshold",
      surface: "governance",
      metadata: { browserRunId: b.id, browserSessionId: b.browserSessionId },
    });
    rows.push({
      tenantId,
      dedupeKey: `gov:POLICY_SNAPSHOT_STALE:stuck_browser:${b.id}`,
      traceId: b.traceId,
      sessionId: null,
      assistantId: null,
      code: "POLICY_SNAPSHOT_STALE",
      severity: "warn",
      message: "Browser automation stalled — snapshot projection may be stale",
      surface: "policy",
      metadata: { browserRunId: b.id },
    });
  }

  for (const m of fatalAssistantMessages) {
    const fatal = metaFatal(m.metadata);
    if (!fatal) continue;
    const code = governancePrimaryCodeFromFatal(fatal);
    rows.push({
      tenantId,
      dedupeKey: `gov:${code}:msg_fatal:${m.id}`,
      traceId: null,
      sessionId: m.sessionId,
      assistantId: null,
      code,
      severity: "warn",
      message: fatal.slice(0, 2048),
      surface: "policy",
      metadata: { messageId: m.id },
    });
  }

  if (rows.length === 0) return;

  await prisma.runtimeGovernanceAuditEvent.createMany({
    data: rows,
    skipDuplicates: true,
  });
}
