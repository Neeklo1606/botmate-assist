import { Queue } from "bullmq";
import type { Redis } from "ioredis";
import { DEFAULT_JOB_OPTIONS } from "./default-job-options.js";
import { JOB_NAMES, QUEUE_NAMES } from "./queue-names.js";

export interface JobQueues {
  knowledgeProcess: Queue;
  embeddingsGenerate: Queue;
  webhookDeliver: Queue;
  analyticsRollup: Queue;
  notificationsDispatch: Queue;
  assistantRun: Queue;
  toolsAsyncExecute: Queue;
  browserRun: Queue;
  browserFeedSnapshot: Queue;
  browserCleanup: Queue;
  artifactCleanup: Queue;
  runtimeReconcile: Queue;
}

export function createJobQueues(connection: Redis): JobQueues {
  const opts = { connection, defaultJobOptions: DEFAULT_JOB_OPTIONS };
  return {
    knowledgeProcess: new Queue(QUEUE_NAMES.knowledgeProcess, opts),
    embeddingsGenerate: new Queue(QUEUE_NAMES.embeddingsGenerate, opts),
    webhookDeliver: new Queue(QUEUE_NAMES.webhookDeliver, opts),
    analyticsRollup: new Queue(QUEUE_NAMES.analyticsRollup, opts),
    notificationsDispatch: new Queue(QUEUE_NAMES.notificationsDispatch, opts),
    assistantRun: new Queue(QUEUE_NAMES.assistantRun, opts),
    toolsAsyncExecute: new Queue(QUEUE_NAMES.toolsAsyncExecute, opts),
    browserRun: new Queue(QUEUE_NAMES.browserRun, opts),
    browserFeedSnapshot: new Queue(QUEUE_NAMES.browserFeedSnapshot, opts),
    browserCleanup: new Queue(QUEUE_NAMES.browserCleanup, opts),
    artifactCleanup: new Queue(QUEUE_NAMES.artifactCleanup, opts),
    runtimeReconcile: new Queue(QUEUE_NAMES.runtimeReconcile, opts),
  };
}

export async function closeJobQueues(queues: JobQueues): Promise<void> {
  await Promise.all([
    queues.knowledgeProcess.close(),
    queues.embeddingsGenerate.close(),
    queues.webhookDeliver.close(),
    queues.analyticsRollup.close(),
    queues.notificationsDispatch.close(),
    queues.assistantRun.close(),
    queues.toolsAsyncExecute.close(),
    queues.browserRun.close(),
    queues.browserFeedSnapshot.close(),
    queues.browserCleanup.close(),
    queues.artifactCleanup.close(),
    queues.runtimeReconcile.close(),
  ]);
}

/** Typed enqueue helpers — safe defaults for dispatch surfaces (API tier). */
export const enqueue = {
  async knowledgeProcess(queue: Queue, data: Record<string, unknown>, jobOpts?: Partial<typeof DEFAULT_JOB_OPTIONS>) {
    return queue.add(JOB_NAMES.KNOWLEDGE_PROCESS, data, { ...DEFAULT_JOB_OPTIONS, ...jobOpts });
  },
  async embeddingsGenerate(queue: Queue, data: Record<string, unknown>, jobOpts?: Partial<typeof DEFAULT_JOB_OPTIONS>) {
    return queue.add(JOB_NAMES.EMBEDDINGS_GENERATE, data, { ...DEFAULT_JOB_OPTIONS, ...jobOpts });
  },
  async webhookDeliver(queue: Queue, data: Record<string, unknown>, jobOpts?: Partial<typeof DEFAULT_JOB_OPTIONS>) {
    return queue.add(JOB_NAMES.WEBHOOK_DELIVER, data, { ...DEFAULT_JOB_OPTIONS, ...jobOpts });
  },
  async analyticsRollup(queue: Queue, data: Record<string, unknown>, jobOpts?: Partial<typeof DEFAULT_JOB_OPTIONS>) {
    return queue.add(JOB_NAMES.ANALYTICS_ROLLUP, data, { ...DEFAULT_JOB_OPTIONS, ...jobOpts });
  },
  async notificationsDispatch(queue: Queue, data: Record<string, unknown>, jobOpts?: Partial<typeof DEFAULT_JOB_OPTIONS>) {
    return queue.add(JOB_NAMES.NOTIFICATIONS_DISPATCH, data, { ...DEFAULT_JOB_OPTIONS, ...jobOpts });
  },
  async assistantRun(queue: Queue, data: Record<string, unknown>, jobOpts?: Partial<typeof DEFAULT_JOB_OPTIONS>) {
    return queue.add(JOB_NAMES.ASSISTANT_RUN, data, { ...DEFAULT_JOB_OPTIONS, ...jobOpts });
  },
  async toolsAsyncExecute(queue: Queue, data: Record<string, unknown>, jobOpts?: Partial<typeof DEFAULT_JOB_OPTIONS>) {
    return queue.add(JOB_NAMES.TOOLS_ASYNC_EXECUTE, data, { ...DEFAULT_JOB_OPTIONS, ...jobOpts });
  },
  async browserRun(queue: Queue, data: Record<string, unknown>, jobOpts?: Partial<typeof DEFAULT_JOB_OPTIONS>) {
    return queue.add(JOB_NAMES.BROWSER_RUN, data, { ...DEFAULT_JOB_OPTIONS, ...jobOpts });
  },
  async browserFeedSnapshot(queue: Queue, data: Record<string, unknown>, jobOpts?: Partial<typeof DEFAULT_JOB_OPTIONS>) {
    return queue.add(JOB_NAMES.BROWSER_FEED_SNAPSHOT, data, { ...DEFAULT_JOB_OPTIONS, ...jobOpts });
  },
  async browserCleanup(queue: Queue, data: Record<string, unknown>, jobOpts?: Partial<typeof DEFAULT_JOB_OPTIONS>) {
    return queue.add(JOB_NAMES.BROWSER_CLEANUP, data, { ...DEFAULT_JOB_OPTIONS, ...jobOpts });
  },
  async artifactCleanup(queue: Queue, data: Record<string, unknown>, jobOpts?: Partial<typeof DEFAULT_JOB_OPTIONS>) {
    return queue.add(JOB_NAMES.ARTIFACT_CLEANUP, data, { ...DEFAULT_JOB_OPTIONS, ...jobOpts });
  },
  async runtimeReconcile(queue: Queue, data: Record<string, unknown>, jobOpts?: Partial<typeof DEFAULT_JOB_OPTIONS>) {
    return queue.add(JOB_NAMES.RUNTIME_RECONCILE, data, { ...DEFAULT_JOB_OPTIONS, ...jobOpts });
  },
};
