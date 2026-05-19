import type { Job } from "bullmq";
import type { PrismaClient } from "@botmate/database";
import { ArtifactCleanupPayloadSchema, JOB_NAMES } from "@botmate/jobs";
import { LocalArtifactStore } from "../artifacts/local-store.js";
import { assertRepairRowTenantScoped, enforceSafeSystemQueueIngress } from "@botmate/runtime";

export interface StructuredLoggerLike {
  info(meta: Record<string, unknown>, msg: string): void;
  warn(meta: Record<string, unknown>, msg: string): void;
  error(meta: Record<string, unknown>, msg: string): void;
}

export async function executeArtifactCleanupJob(input: {
  prisma: PrismaClient;
  logger: StructuredLoggerLike;
  job: Job;
  artifactRoot: string;
}): Promise<void> {
  const payload = ArtifactCleanupPayloadSchema.parse(input.job.data);
  enforceSafeSystemQueueIngress({
    jobName: JOB_NAMES.ARTIFACT_CLEANUP,
    tenantId: payload.tenantId ?? null,
    policyContext: payload.policyContext,
    surface: "artifact.cleanup",
    executionId: input.job.id ? String(input.job.id) : undefined,
    logger: input.logger,
  });
  const limit = payload.limit ?? 100;
  const now = new Date();
  const store = new LocalArtifactStore(input.artifactRoot);

  const rows = await input.prisma.browserArtifact.findMany({
    where: {
      ...(payload.tenantId ? { tenantId: payload.tenantId } : {}),
      expiresAt: { lt: now },
      deletedAt: null,
    },
    take: limit,
    select: { id: true, tenantId: true, storageKey: true },
  });

  for (const row of rows) {
    assertRepairRowTenantScoped(payload.tenantId, row.tenantId, "artifact.cleanup.purge_row");
    await store.delete(row.storageKey);
    await input.prisma.browserArtifact.updateMany({
      where: { id: row.id, tenantId: row.tenantId },
      data: { deletedAt: now },
    });
  }

  input.logger.info({ purged: rows.length, jobId: input.job.id }, "artifact_cleanup_pass_complete");
}
