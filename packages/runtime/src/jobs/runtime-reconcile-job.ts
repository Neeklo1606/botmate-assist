import type { PrismaClient } from "@botmate/database";
import { JOB_NAMES, RuntimeReconcilePayloadSchema } from "@botmate/jobs";
import { enforceQueueWorkerIngress } from "../policy/index.js";
import { getRuntimeConsistencyDiagnostics } from "../consistency/runtime-consistency-diagnostics.js";
import { upsertRuntimeActivityFact } from "../runtime-activity/runtime-activity-fact-service.js";
import { executionLifecyclePayload, publishTenantInboxEnvelope } from "../realtime/tenant-inbox-publish.js";
import {
  purgeExpiredRuntimeActivityFacts,
  purgeStaleExecutionFacts,
  purgeStaleGovernanceAuditEvents,
} from "../retention/runtime-retention-policy.js";
import { recordRetentionPurgeCounts } from "../governance-projection/governance-projection-metrics.js";
import { bumpRuntimeReconcileCompleted } from "../enterprise/enterprise-ops-metrics.js";
import { recordReconcileJobObservability } from "../enterprise/enterprise-observability-metrics.js";

export interface StructuredLoggerLike {
  info(meta: Record<string, unknown>, msg: string): void;
  warn(meta: Record<string, unknown>, msg: string): void;
  error(meta: Record<string, unknown>, msg: string): void;
}

const RECONCILE_FACT_TTL_MS = 30 * 86_400_000;

export async function executeRuntimeReconcileJob(input: {
  prisma: PrismaClient;
  logger: StructuredLoggerLike;
  job: { id?: string; data: unknown };
  publishRedis?: (channel: string, wireJson: string) => Promise<void>;
}): Promise<void> {
  const reconcileStarted = Date.now();
  const payload = RuntimeReconcilePayloadSchema.parse(input.job.data);

  enforceQueueWorkerIngress({
    jobName: JOB_NAMES.RUNTIME_RECONCILE,
    tenantId: payload.tenantId,
    policyContext: payload.policyContext,
    executionId: input.job.id ? `job:${input.job.id}` : undefined,
    logger: input.logger,
    dequeuePayloadRecord: { ...payload },
  });

  const report = await getRuntimeConsistencyDiagnostics({
    prisma: input.prisma,
    tenantId: payload.tenantId,
  });

  const dayKey = new Date().toISOString().slice(0, 10);
  let hintKinds = 0;

  for (const issue of report.issues) {
    const dk = `reconcile:issue:${issue.code}:${dayKey}`;
    await upsertRuntimeActivityFact(input.prisma, {
      tenantId: payload.tenantId,
      dedupeKey: dk,
      kind: `runtime.reconcile.${issue.code}`,
      severity: issue.severity === "critical" ? "critical" : issue.severity === "warn" ? "warn" : "info",
      summary: issue.hint.slice(0, 4000),
      payload: {
        code: issue.code,
        count: issue.count,
        sampleIds: issue.sampleIds.slice(0, 24),
        projection: report.projection,
        generatedAt: report.generatedAt,
      },
      expiresAt: new Date(Date.now() + RECONCILE_FACT_TTL_MS),
    });
    hintKinds += 1;
  }

  const jobTrace = `runtime-reconcile:${payload.tenantId}:${input.job.id ?? "adhoc"}`;

  await upsertRuntimeActivityFact(input.prisma, {
    tenantId: payload.tenantId,
    dedupeKey: `reconcile:sweep:${dayKey}:${input.job.id ?? "single"}`,
    kind: "runtime.reconcile.sweep_complete",
    severity: "info",
    traceId: jobTrace,
    executionId: jobTrace,
    correlationId: payload.tenantId,
    summary: `Runtime reconcile sweep completed (${hintKinds} consistency projections materialised).`,
    payload: {
      hintKinds,
      generatedAt: report.generatedAt,
      jobId: input.job.id ?? null,
    },
    expiresAt: new Date(Date.now() + RECONCILE_FACT_TTL_MS),
  });

  if (input.publishRedis && hintKinds > 0) {
    await publishTenantInboxEnvelope({
      publishRedis: input.publishRedis,
      tenantId: payload.tenantId,
      event: "runtime.reconcile_hint",
      payload: executionLifecyclePayload({
        traceId: jobTrace,
        executionId: jobTrace,
        correlationId: payload.tenantId,
        runtimeSurface: "worker.runtime.reconcile",
        policyDecision: "UNKNOWN",
        replayTier: "none",
        extra: {
          hintKinds,
          projection: report.projection,
          generatedAt: report.generatedAt,
          jobId: input.job.id ?? null,
        },
      }),
      governanceSurfaceId: "surface.worker.runtime.reconcile_inbox",
    });
  }

  const purgedFacts = await purgeExpiredRuntimeActivityFacts(input.prisma, {
    tenantId: payload.tenantId,
  });
  const purgedAudit = await purgeStaleGovernanceAuditEvents(input.prisma, {
    tenantId: payload.tenantId,
  });
  const purgedExecutionFacts = await purgeStaleExecutionFacts(input.prisma, {
    tenantId: payload.tenantId,
  });
  recordRetentionPurgeCounts({
    activityFacts: purgedFacts.deleted,
    governanceAudit: purgedAudit.deleted,
    executionFacts: purgedExecutionFacts.deleted,
  });

  bumpRuntimeReconcileCompleted();
  recordReconcileJobObservability({ hintKinds, durationMs: Date.now() - reconcileStarted });

  input.logger.info(
    { tenantId: payload.tenantId, hintKinds, purgedFacts, purgedAudit, purgedExecutionFacts },
    "runtime_reconcile_job_complete",
  );
}
