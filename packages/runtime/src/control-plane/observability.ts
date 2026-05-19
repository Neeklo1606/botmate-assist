import type { PrismaClient } from "@botmate/database";

function stuckThresholdMs(): number {
  const v = Number(process.env.RUNTIME_STUCK_THRESHOLD_MS ?? `${1_800_000}`);
  return Math.min(86_400_000, Math.max(120_000, Math.floor(v)));
}

/** Lightweight execution signals — aggregates only (no distributed traces yet). */
export async function collectExecutionSignals(prisma: PrismaClient): Promise<{
  stuckThresholdMs: number;
  stuckToolInvocationsStart: number;
  stuckBrowserRuns: number;
  browserRunsByStatus: Record<string, number>;
}> {
  const staleBefore = new Date(Date.now() - stuckThresholdMs());

  const [stuckTools, stuckBrowserRuns, queued, running, succeeded, failed, cancelled] = await Promise.all([
    prisma.toolInvocation.count({
      where: { status: "START", createdAt: { lt: staleBefore } },
    }),
    prisma.browserRun.count({
      where: {
        status: "running",
        updatedAt: { lt: staleBefore },
      },
    }),
    prisma.browserRun.count({ where: { status: "queued" } }),
    prisma.browserRun.count({ where: { status: "running" } }),
    prisma.browserRun.count({ where: { status: "succeeded" } }),
    prisma.browserRun.count({ where: { status: "failed" } }),
    prisma.browserRun.count({ where: { status: "cancelled" } }),
  ]);

  return {
    stuckThresholdMs: stuckThresholdMs(),
    stuckToolInvocationsStart: stuckTools,
    stuckBrowserRuns,
    browserRunsByStatus: {
      queued,
      running,
      succeeded,
      failed,
      cancelled,
    },
  };
}
