import type { Job } from "bullmq";
import type { PrismaClient } from "@botmate/database";
import { BrowserCleanupPayloadSchema, JOB_NAMES } from "@botmate/jobs";
import {
  assertRepairRowTenantScoped,
  bumpOperatorLeaseExpiredCleanup,
  enforceSafeSystemQueueIngress,
} from "@botmate/runtime";

export interface StructuredLoggerLike {
  info(meta: Record<string, unknown>, msg: string): void;
  warn(meta: Record<string, unknown>, msg: string): void;
  error(meta: Record<string, unknown>, msg: string): void;
}

/** Reclaim stale worker leases — worker crashes must not deadlock sessions indefinitely. */
export async function executeBrowserCleanupJob(input: {
  prisma: PrismaClient;
  logger: StructuredLoggerLike;
  job: Job;
}): Promise<void> {
  const raw = BrowserCleanupPayloadSchema.parse(input.job.data);
  enforceSafeSystemQueueIngress({
    jobName: JOB_NAMES.BROWSER_CLEANUP,
    tenantId: raw.tenantId ?? null,
    policyContext: raw.policyContext,
    surface: "browser.cleanup",
    executionId: input.job.id ? String(input.job.id) : undefined,
    logger: input.logger,
  });
  const limit = raw.limit ?? 50;
  const now = new Date();
  const mode = raw.mode ?? "reclaim_stale_leases";

  if (mode === "expire_idle_sessions") {
    input.logger.info({ jobId: input.job.id }, "browser_cleanup_expire_idle_sessions_noop_phase5d");
    return;
  }

  if (mode === "expire_operator_leases") {
    const tenantFilter = raw.tenantId ? { tenantId: raw.tenantId } : {};

    const takeoverSessions = await input.prisma.browserSession.updateMany({
      where: {
        ...tenantFilter,
        takeoverLeaseExpiresAt: { lt: now },
        takeoverUserId: { not: null },
        operatorMode: "takeover",
      },
      data: {
        takeoverUserId: null,
        takeoverLeaseExpiresAt: null,
        operatorMode: "none",
        operatorUserId: null,
        operatorLeaseExpiresAt: null,
      },
    });

    const takeoverOrphans = await input.prisma.browserSession.updateMany({
      where: {
        ...tenantFilter,
        takeoverLeaseExpiresAt: { lt: now },
        takeoverUserId: { not: null },
      },
      data: {
        takeoverUserId: null,
        takeoverLeaseExpiresAt: null,
      },
    });

    const observeSessions = await input.prisma.browserSession.updateMany({
      where: {
        ...tenantFilter,
        operatorLeaseExpiresAt: { lt: now },
        operatorUserId: { not: null },
        operatorMode: { in: ["observe", "join"] },
      },
      data: {
        operatorUserId: null,
        operatorLeaseExpiresAt: null,
        operatorMode: "none",
      },
    });

    const patched = takeoverSessions.count + takeoverOrphans.count + observeSessions.count;
    bumpOperatorLeaseExpiredCleanup(patched);
    input.logger.info({ patched, jobId: input.job.id }, "browser_cleanup_operator_leases_complete");
    return;
  }

  const staleSessions = await input.prisma.browserSession.findMany({
    where: {
      ...(raw.tenantId ? { tenantId: raw.tenantId } : {}),
      leaseExpiresAt: { lt: now },
      leaseOwner: { not: null },
      status: { in: ["creating", "running"] },
    },
    take: limit,
    select: { id: true, tenantId: true },
  });

  for (const row of staleSessions) {
    assertRepairRowTenantScoped(raw.tenantId, row.tenantId, "browser.cleanup.reclaim_session_row");
    await input.prisma.browserSession.updateMany({
      where: { id: row.id, tenantId: row.tenantId },
      data: {
        leaseOwner: null,
        leaseExpiresAt: null,
        status: "idle_soft",
      },
    });
    await input.prisma.browserRun.updateMany({
      where: {
        tenantId: row.tenantId,
        browserSessionId: row.id,
        status: "running",
      },
      data: {
        status: "failed",
        finishedAt: now,
        error: { code: "browser_stale_lease", message: "Worker lease expired — job aborted for recovery" },
      },
    });
  }

  input.logger.info({ reclaimed: staleSessions.length, jobId: input.job.id }, "browser_cleanup_pass_complete");
}
