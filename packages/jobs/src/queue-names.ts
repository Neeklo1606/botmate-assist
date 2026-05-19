/** Queue names — BullMQ v5 disallows `:` in queue names; use dot prefixes (not `bm:rt:*`). */
export const QUEUE_NAMES = {
  knowledgeProcess: "q.knowledge.process",
  embeddingsGenerate: "q.embeddings.generate",
  webhookDeliver: "q.webhook.deliver",
  analyticsRollup: "q.analytics.rollup",
  notificationsDispatch: "q.notifications.dispatch",
  assistantRun: "q.assistant.run",
  toolsAsyncExecute: "q.tools.async.execute",
  browserRun: "q.browser.run",
  browserFeedSnapshot: "q.browser.feed.snapshot",
  browserCleanup: "q.browser.cleanup",
  artifactCleanup: "q.artifact.cleanup",
  runtimeReconcile: "q.runtime.reconcile",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/** BullMQ job.name values — dot-case boundaries for tracing + dashboards. */
export const JOB_NAMES = {
  KNOWLEDGE_PROCESS: "knowledge.process",
  EMBEDDINGS_GENERATE: "embeddings.generate",
  WEBHOOK_DELIVER: "webhook.deliver",
  ANALYTICS_ROLLUP: "analytics.rollup",
  NOTIFICATIONS_DISPATCH: "notifications.dispatch",
  ASSISTANT_RUN: "assistant.run",
  TOOLS_ASYNC_EXECUTE: "tools.async.execute",
  BROWSER_RUN: "browser.run",
  BROWSER_FEED_SNAPSHOT: "browser.feed.snapshot",
  BROWSER_CLEANUP: "browser.cleanup",
  ARTIFACT_CLEANUP: "artifact.cleanup",
  RUNTIME_RECONCILE: "runtime.reconcile",
} as const;

export function dlqQueueName(primary: QueueName): string {
  return `${primary}.dlq`;
}
