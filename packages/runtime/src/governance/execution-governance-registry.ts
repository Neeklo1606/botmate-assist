import { JOB_NAMES } from "@botmate/jobs";

/** Governance dimensions — telemetry / audit normalization (`EXECUTION_GOVERNANCE_REGISTRY.md`). */
export type ExecutionMutationClass =
  | "none"
  | "read"
  | "sync_api"
  | "async_worker"
  | "realtime_fanout"
  | "sse_transport"
  | "browser_dom"
  | "replay_eval";

export type GovernanceSensitivity = "none" | "low" | "medium" | "high";

export interface ExecutionGovernanceSurfaceDescriptor {
  surfaceKind: string;
  sync: boolean;
  mutationClass: ExecutionMutationClass;
  replayClass: GovernanceSensitivity;
  browserSensitivity: GovernanceSensitivity;
  operatorSensitivity: GovernanceSensitivity;
  tenantSensitivity: "strict" | "relaxed";
}

/**
 * Canonical governance ids — additive registry keys only.
 * Queue ids align with **`governanceSurfaceIdForJobName`**.
 */
export const EXECUTION_GOVERNANCE_REGISTRY: Record<string, ExecutionGovernanceSurfaceDescriptor> = {
  "surface.worker.notifications.redis_fanout": {
    surfaceKind: "redis_pubsub_bridge",
    sync: false,
    mutationClass: "realtime_fanout",
    replayClass: "none",
    browserSensitivity: "none",
    operatorSensitivity: "none",
    tenantSensitivity: "strict",
  },
  "surface.queue.knowledge.process": {
    surfaceKind: "bullmq_job",
    sync: false,
    mutationClass: "async_worker",
    replayClass: "low",
    browserSensitivity: "none",
    operatorSensitivity: "none",
    tenantSensitivity: "strict",
  },
  "surface.queue.embeddings.generate": {
    surfaceKind: "bullmq_job",
    sync: false,
    mutationClass: "async_worker",
    replayClass: "low",
    browserSensitivity: "none",
    operatorSensitivity: "none",
    tenantSensitivity: "strict",
  },
  "surface.queue.notifications.dispatch": {
    surfaceKind: "bullmq_job",
    sync: false,
    mutationClass: "async_worker",
    replayClass: "low",
    browserSensitivity: "none",
    operatorSensitivity: "none",
    tenantSensitivity: "strict",
  },
  "surface.queue.assistant.run": {
    surfaceKind: "bullmq_job",
    sync: false,
    mutationClass: "async_worker",
    replayClass: "medium",
    browserSensitivity: "none",
    operatorSensitivity: "none",
    tenantSensitivity: "strict",
  },
  "surface.queue.tools.async.execute": {
    surfaceKind: "bullmq_job",
    sync: false,
    mutationClass: "async_worker",
    replayClass: "medium",
    browserSensitivity: "medium",
    operatorSensitivity: "none",
    tenantSensitivity: "strict",
  },
  "surface.queue.browser.run": {
    surfaceKind: "bullmq_job",
    sync: false,
    mutationClass: "async_worker",
    replayClass: "medium",
    browserSensitivity: "high",
    operatorSensitivity: "medium",
    tenantSensitivity: "strict",
  },
  "surface.queue.browser.feed.snapshot": {
    surfaceKind: "bullmq_job",
    sync: false,
    mutationClass: "async_worker",
    replayClass: "low",
    browserSensitivity: "high",
    operatorSensitivity: "high",
    tenantSensitivity: "strict",
  },
  "surface.queue.browser.cleanup": {
    surfaceKind: "bullmq_job",
    sync: false,
    mutationClass: "async_worker",
    replayClass: "low",
    browserSensitivity: "high",
    operatorSensitivity: "medium",
    tenantSensitivity: "strict",
  },
  "surface.queue.artifact.cleanup": {
    surfaceKind: "bullmq_job",
    sync: false,
    mutationClass: "async_worker",
    replayClass: "low",
    browserSensitivity: "medium",
    operatorSensitivity: "none",
    tenantSensitivity: "strict",
  },
  "surface.queue.runtime.reconcile": {
    surfaceKind: "bullmq_job",
    sync: false,
    mutationClass: "async_worker",
    replayClass: "low",
    browserSensitivity: "none",
    operatorSensitivity: "low",
    tenantSensitivity: "strict",
  },
  "surface.realtime.workspace_fanout": {
    surfaceKind: "realtime_gateway",
    sync: true,
    mutationClass: "realtime_fanout",
    replayClass: "none",
    browserSensitivity: "none",
    operatorSensitivity: "none",
    tenantSensitivity: "strict",
  },
  "surface.realtime.operator_browser_feed": {
    surfaceKind: "realtime_gateway",
    sync: true,
    mutationClass: "realtime_fanout",
    replayClass: "none",
    browserSensitivity: "high",
    operatorSensitivity: "high",
    tenantSensitivity: "strict",
  },
  "surface.browser.redis.browser_run": {
    surfaceKind: "redis_pubsub_bridge",
    sync: false,
    mutationClass: "realtime_fanout",
    replayClass: "low",
    browserSensitivity: "high",
    operatorSensitivity: "medium",
    tenantSensitivity: "strict",
  },
  "surface.browser.redis.feed_snapshot": {
    surfaceKind: "redis_pubsub_bridge",
    sync: false,
    mutationClass: "realtime_fanout",
    replayClass: "low",
    browserSensitivity: "high",
    operatorSensitivity: "high",
    tenantSensitivity: "strict",
  },
};

export function resolveGovernanceSurface(id: string): ExecutionGovernanceSurfaceDescriptor | undefined {
  return EXECUTION_GOVERNANCE_REGISTRY[id];
}

/** Maps Bull **`job.name`** → Phase 8H governance surface id (async dequeue instrumentation). */
export function governanceSurfaceIdForJobName(jobName: string): string | undefined {
  switch (jobName) {
    case JOB_NAMES.KNOWLEDGE_PROCESS:
      return "surface.queue.knowledge.process";
    case JOB_NAMES.EMBEDDINGS_GENERATE:
      return "surface.queue.embeddings.generate";
    case JOB_NAMES.NOTIFICATIONS_DISPATCH:
      return "surface.queue.notifications.dispatch";
    case JOB_NAMES.ASSISTANT_RUN:
      return "surface.queue.assistant.run";
    case JOB_NAMES.TOOLS_ASYNC_EXECUTE:
      return "surface.queue.tools.async.execute";
    case JOB_NAMES.BROWSER_RUN:
      return "surface.queue.browser.run";
    case JOB_NAMES.BROWSER_FEED_SNAPSHOT:
      return "surface.queue.browser.feed.snapshot";
    case JOB_NAMES.BROWSER_CLEANUP:
      return "surface.queue.browser.cleanup";
    case JOB_NAMES.ARTIFACT_CLEANUP:
      return "surface.queue.artifact.cleanup";
    case JOB_NAMES.RUNTIME_RECONCILE:
      return "surface.queue.runtime.reconcile";
    default:
      return undefined;
  }
}
