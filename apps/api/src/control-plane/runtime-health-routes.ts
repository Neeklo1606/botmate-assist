import type { FastifyInstance } from "fastify";
import { prisma } from "@botmate/database";
import { workerStubMetricsSnapshot } from "@botmate/jobs";
import {
  buildRuntimeRegistrySnapshot,
  bumpQueueStaleWaitingSignal,
  collectExecutionReliabilitySignals,
  collectStorageRetentionSignals,
  collectTenantUsageSignals,
  isAssistantRunEnqueueEnabled,
  isProductionStrictMode,
  runtimeMetricsSnapshot,
} from "@botmate/runtime";
import { getOptionalJobQueues } from "../routes/notifications.js";
import { getRealtimeMetricsSnapshot } from "../realtime/realtime-metrics.js";
import type { RedisBackedRealtimePubSub } from "../realtime/redis-pubsub-boundary.js";

async function fetchQueueCountsSnapshot(): Promise<Record<string, Record<string, number>> | null> {
  const queues = getOptionalJobQueues();
  if (!queues) return null;

  const [
    knowledgeProcess,
    embeddingsGenerate,
    webhookDeliver,
    analyticsRollup,
    notificationsDispatch,
    assistantRun,
    toolsAsyncExecute,
    browserRun,
    browserFeedSnapshot,
    browserCleanup,
    artifactCleanup,
    runtimeReconcile,
  ] = await Promise.all([
    queues.knowledgeProcess.getJobCounts(),
    queues.embeddingsGenerate.getJobCounts(),
    queues.webhookDeliver.getJobCounts(),
    queues.analyticsRollup.getJobCounts(),
    queues.notificationsDispatch.getJobCounts(),
    queues.assistantRun.getJobCounts(),
    queues.toolsAsyncExecute.getJobCounts(),
    queues.browserRun.getJobCounts(),
    queues.browserFeedSnapshot.getJobCounts(),
    queues.browserCleanup.getJobCounts(),
    queues.artifactCleanup.getJobCounts(),
    queues.runtimeReconcile.getJobCounts(),
  ]);

  return {
    knowledgeProcess,
    embeddingsGenerate,
    webhookDeliver,
    analyticsRollup,
    notificationsDispatch,
    assistantRun,
    toolsAsyncExecute,
    browserRun,
    browserFeedSnapshot,
    browserCleanup,
    artifactCleanup,
    runtimeReconcile,
  };
}

const QUEUE_WAITING_STALE_THRESHOLD = Number(process.env.RUNTIME_QUEUE_WAITING_STALE_THRESHOLD ?? "250");

function summarizeQueuePressure(
  queueCounts: Record<string, Record<string, number>> | null,
): Record<string, { waiting: number; active: number; staleWaiting: boolean }> | null {
  if (!queueCounts) return null;
  const out: Record<string, { waiting: number; active: number; staleWaiting: boolean }> = {};
  for (const [name, counts] of Object.entries(queueCounts)) {
    const waiting = counts.waiting ?? 0;
    const active = counts.active ?? 0;
    const staleWaiting = waiting >= QUEUE_WAITING_STALE_THRESHOLD;
    if (staleWaiting) bumpQueueStaleWaitingSignal();
    out[name] = { waiting, active, staleWaiting };
  }
  return out;
}

export function registerRuntimeHealthRoutes(
  app: FastifyInstance,
  deps: { redisPubSub: RedisBackedRealtimePubSub | null },
): void {
  app.get("/health/runtime", async () => {
    const registry = buildRuntimeRegistrySnapshot();
    const metrics = runtimeMetricsSnapshot();
    const workerStubMetrics = workerStubMetricsSnapshot();
    if (!registry.controlPlaneEnabled) {
      return {
        ok: true,
        controlPlaneTelemetry: "slim",
        registry,
        metrics,
        workerStubMetrics,
      };
    }

    const [executionReliability, queueCounts, storageRetention, tenantUsage] = await Promise.all([
      collectExecutionReliabilitySignals(prisma),
      fetchQueueCountsSnapshot(),
      collectStorageRetentionSignals(prisma),
      collectTenantUsageSignals(prisma),
    ]);
    const queuePressure = summarizeQueuePressure(queueCounts);

    return {
      ok: true,
      controlPlaneTelemetry: "full",
      registry,
      metrics,
      workerStubMetrics,
      executionReliability,
      tenantUsage,
      storageRetention,
      productionProfile: {
        strictMode: isProductionStrictMode(),
        assistantRunEnqueueEnabled: isAssistantRunEnqueueEnabled(),
        executionFactPurgeEnabled: process.env.RUNTIME_EXECUTION_FACT_PURGE_ENABLED === "true",
        governanceAuditPurgeEnabled: process.env.RUNTIME_GOVERNANCE_AUDIT_PURGE_ENABLED === "true",
      },
      bullMqQueuesEnabled: Boolean(queueCounts),
      queueCounts,
      queuePressure,
      realtimeTransport: {
        redisPubSubEnabled: Boolean(deps.redisPubSub),
        redisReconnectSnapshot: deps.redisPubSub?.reconnectSnapshot() ?? null,
      },
      realtimeMetrics: getRealtimeMetricsSnapshot(),
    };
  });

  app.get("/health/runtime/executions", async () => {
    const registry = buildRuntimeRegistrySnapshot();
    if (!registry.controlPlaneEnabled) {
      return {
        ok: true,
        controlPlaneTelemetry: "slim",
        executionSignals: null,
      };
    }
    const executionReliability = await collectExecutionReliabilitySignals(prisma);
    return {
      ok: true,
      controlPlaneTelemetry: "full",
      executionReliability,
    };
  });

  app.get("/health/runtime/queues", async () => {
    const registry = buildRuntimeRegistrySnapshot();
    const queueCounts = await fetchQueueCountsSnapshot();
    return {
      ok: true,
      controlPlaneTelemetry: registry.controlPlaneEnabled ? "full" : "slim",
      bullMqQueuesEnabled: Boolean(queueCounts),
      queueCounts,
      queuePressure: summarizeQueuePressure(queueCounts),
    };
  });

  app.get("/health/runtime/realtime", async () => {
    const registry = buildRuntimeRegistrySnapshot();
    return {
      ok: true,
      controlPlaneTelemetry: registry.controlPlaneEnabled ? "full" : "slim",
      redisPubSubEnabled: Boolean(deps.redisPubSub),
      redisReconnectSnapshot: deps.redisPubSub?.reconnectSnapshot() ?? null,
      metrics: getRealtimeMetricsSnapshot(),
    };
  });
}
