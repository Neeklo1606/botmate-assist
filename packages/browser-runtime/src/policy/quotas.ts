import type { PrismaClient } from "@botmate/database";
import { browserMaxArtifactsPerRun, browserMaxRunsPerTenantDay } from "../constants.js";

export async function assertTenantDailyRunBudget(prisma: PrismaClient, tenantId: string): Promise<void> {
  const max = browserMaxRunsPerTenantDay();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const count = await prisma.browserRun.count({
    where: { tenantId, createdAt: { gte: start } },
  });
  if (count >= max) {
    throw new Error("browser_quota_daily_runs_exceeded");
  }
}

export function assertArtifactBudget(currentArtifactCount: number): void {
  if (currentArtifactCount >= browserMaxArtifactsPerRun()) {
    throw new Error("browser_quota_artifacts_per_run");
  }
}
