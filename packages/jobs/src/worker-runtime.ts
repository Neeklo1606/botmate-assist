import { Queue, Worker, type Job } from "bullmq";
import type { Redis } from "ioredis";
import { DEFAULT_JOB_OPTIONS } from "./default-job-options.js";
import { JOB_SCHEMA_BY_NAME } from "./job-schemas.js";
import { QUEUE_NAMES, dlqQueueName, type QueueName } from "./queue-names.js";
import { bumpWorkerStubCompletion, bumpWorkerStubRejection } from "./worker-stub-metrics.js";

/** Queues that intentionally remain stub until product wiring (Phase 11B). */
const INTENTIONAL_STUB_QUEUES = new Set<QueueName>([
  QUEUE_NAMES.webhookDeliver,
  QUEUE_NAMES.analyticsRollup,
]);

function workerRejectStubEnabled(): boolean {
  const raw = process.env.BOTMATE_WORKER_REJECT_STUB?.trim().toLowerCase();
  if (raw === "true" || raw === "1") return true;
  const strict = process.env.BOTMATE_PRODUCTION_STRICT?.trim().toLowerCase();
  return strict === "true" || strict === "1";
}

export interface StructuredLogger {
  info(meta: Record<string, unknown>, msg: string): void;
  warn(meta: Record<string, unknown>, msg: string): void;
  error(meta: Record<string, unknown>, msg: string): void;
}

export function createConsoleStructuredLogger(scope: string): StructuredLogger {
  const base = { scope };
  return {
    info(meta, msg) {
      console.log(JSON.stringify({ level: "info", ...base, ...meta, msg }));
    },
    warn(meta, msg) {
      console.warn(JSON.stringify({ level: "warn", ...base, ...meta, msg }));
    },
    error(meta, msg) {
      console.error(JSON.stringify({ level: "error", ...base, ...meta, msg }));
    },
  };
}

async function forwardToDlq(connection: Redis, queueName: QueueName, job: Job, err: unknown): Promise<void> {
  const dlqName = dlqQueueName(queueName);
  const dlq = new Queue(dlqName, { connection });
  try {
    await dlq.add(
      `${job.name}:dead`,
      {
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        payload: job.data,
        stack: err instanceof Error ? err.stack : String(err),
      },
      { removeOnComplete: false, removeOnFail: false },
    );
  } finally {
    await dlq.close();
  }
}

function validateJob(job: Job): void {
  const schema = JOB_SCHEMA_BY_NAME[job.name as keyof typeof JOB_SCHEMA_BY_NAME];
  if (!schema) {
    throw new Error(`unknown_job_name:${job.name}`);
  }
  schema.parse(job.data);
}

async function stubOk(job: Job, logger: StructuredLogger, queue: QueueName): Promise<void> {
  const intentional = INTENTIONAL_STUB_QUEUES.has(queue);
  bumpWorkerStubCompletion(
    queue,
    intentional ? "intentional_stub" : "missing_processor",
  );
  logger.warn(
    {
      jobId: job.id,
      name: job.name,
      queue,
      attemptsMade: job.attemptsMade,
      tenantId: (job.data as { tenantId?: string }).tenantId,
      intentionalStub: intentional,
      rejectStubEnabled: workerRejectStubEnabled(),
    },
    "job_boundary_stub_complete",
  );
}

async function runWithProcessorOrStub(input: {
  job: Job;
  logger: StructuredLogger;
  queue: QueueName;
  run?: () => Promise<void>;
}): Promise<void> {
  if (input.run) {
    await input.run();
    return;
  }
  if (workerRejectStubEnabled() && !INTENTIONAL_STUB_QUEUES.has(input.queue)) {
    bumpWorkerStubRejection(input.queue);
    throw new Error(`WORKER_PROCESSOR_MISSING:${input.queue}`);
  }
  await stubOk(input.job, input.logger, input.queue);
}

export interface WorkerRuntime {
  workers: Worker[];
  close(): Promise<void>;
}

export interface WorkerBootstrapOptions {
  assistantProcessor?: (job: Job, logger: StructuredLogger) => Promise<void>;
  knowledgeProcessor?: (job: Job, logger: StructuredLogger) => Promise<void>;
  embeddingsProcessor?: (job: Job, logger: StructuredLogger) => Promise<void>;
  notificationsProcessor?: (job: Job, logger: StructuredLogger) => Promise<void>;
  toolsAsyncProcessor?: (job: Job, logger: StructuredLogger) => Promise<void>;
  browserRunProcessor?: (job: Job, logger: StructuredLogger) => Promise<void>;
  browserFeedSnapshotProcessor?: (job: Job, logger: StructuredLogger) => Promise<void>;
  browserCleanupProcessor?: (job: Job, logger: StructuredLogger) => Promise<void>;
  artifactCleanupProcessor?: (job: Job, logger: StructuredLogger) => Promise<void>;
  runtimeReconcileProcessor?: (job: Job, logger: StructuredLogger) => Promise<void>;
}

/** Registers BullMQ workers — assistant queue optionally executes Phase 4A AI runtime. */
export function startWorkers(
  connection: Redis,
  logger: StructuredLogger = createConsoleStructuredLogger("worker"),
  options?: WorkerBootstrapOptions,
): WorkerRuntime {
  const workers: Worker[] = [];

  const lockMsByQueue: Partial<Record<QueueName, number>> = {
    [QUEUE_NAMES.toolsAsyncExecute]: Number(process.env.WORKER_TOOLS_LOCK_MS ?? `${600_000}`),
    [QUEUE_NAMES.browserRun]: Number(process.env.WORKER_BROWSER_LOCK_MS ?? `${240_000}`),
    [QUEUE_NAMES.browserFeedSnapshot]: Number(process.env.WORKER_BROWSER_FEED_SNAPSHOT_LOCK_MS ?? `${120_000}`),
  };

  const defs: Array<{ queue: QueueName; processor: (job: Job) => Promise<void> }> = [
    {
      queue: QUEUE_NAMES.knowledgeProcess,
      processor: async (job: Job) => {
        validateJob(job);
        await runWithProcessorOrStub({
          job,
          logger,
          queue: QUEUE_NAMES.knowledgeProcess,
          run: options?.knowledgeProcessor ? () => options.knowledgeProcessor!(job, logger) : undefined,
        });
      },
    },
    {
      queue: QUEUE_NAMES.embeddingsGenerate,
      processor: async (job: Job) => {
        validateJob(job);
        await runWithProcessorOrStub({
          job,
          logger,
          queue: QUEUE_NAMES.embeddingsGenerate,
          run: options?.embeddingsProcessor ? () => options.embeddingsProcessor!(job, logger) : undefined,
        });
      },
    },
    {
      queue: QUEUE_NAMES.webhookDeliver,
      processor: async (job: Job) => {
        validateJob(job);
        await runWithProcessorOrStub({ job, logger, queue: QUEUE_NAMES.webhookDeliver });
      },
    },
    {
      queue: QUEUE_NAMES.analyticsRollup,
      processor: async (job: Job) => {
        validateJob(job);
        await runWithProcessorOrStub({ job, logger, queue: QUEUE_NAMES.analyticsRollup });
      },
    },
    {
      queue: QUEUE_NAMES.notificationsDispatch,
      processor: async (job: Job) => {
        validateJob(job);
        await runWithProcessorOrStub({
          job,
          logger,
          queue: QUEUE_NAMES.notificationsDispatch,
          run: options?.notificationsProcessor ? () => options.notificationsProcessor!(job, logger) : undefined,
        });
      },
    },
    {
      queue: QUEUE_NAMES.assistantRun,
      processor: async (job: Job) => {
        validateJob(job);
        await runWithProcessorOrStub({
          job,
          logger,
          queue: QUEUE_NAMES.assistantRun,
          run: options?.assistantProcessor ? () => options.assistantProcessor!(job, logger) : undefined,
        });
      },
    },
    {
      queue: QUEUE_NAMES.toolsAsyncExecute,
      processor: async (job: Job) => {
        validateJob(job);
        await runWithProcessorOrStub({
          job,
          logger,
          queue: QUEUE_NAMES.toolsAsyncExecute,
          run: options?.toolsAsyncProcessor ? () => options.toolsAsyncProcessor!(job, logger) : undefined,
        });
      },
    },
    {
      queue: QUEUE_NAMES.browserRun,
      processor: async (job: Job) => {
        validateJob(job);
        await runWithProcessorOrStub({
          job,
          logger,
          queue: QUEUE_NAMES.browserRun,
          run: options?.browserRunProcessor ? () => options.browserRunProcessor!(job, logger) : undefined,
        });
      },
    },
    {
      queue: QUEUE_NAMES.browserFeedSnapshot,
      processor: async (job: Job) => {
        validateJob(job);
        await runWithProcessorOrStub({
          job,
          logger,
          queue: QUEUE_NAMES.browserFeedSnapshot,
          run: options?.browserFeedSnapshotProcessor
            ? () => options.browserFeedSnapshotProcessor!(job, logger)
            : undefined,
        });
      },
    },
    {
      queue: QUEUE_NAMES.browserCleanup,
      processor: async (job: Job) => {
        validateJob(job);
        await runWithProcessorOrStub({
          job,
          logger,
          queue: QUEUE_NAMES.browserCleanup,
          run: options?.browserCleanupProcessor ? () => options.browserCleanupProcessor!(job, logger) : undefined,
        });
      },
    },
    {
      queue: QUEUE_NAMES.artifactCleanup,
      processor: async (job: Job) => {
        validateJob(job);
        await runWithProcessorOrStub({
          job,
          logger,
          queue: QUEUE_NAMES.artifactCleanup,
          run: options?.artifactCleanupProcessor ? () => options.artifactCleanupProcessor!(job, logger) : undefined,
        });
      },
    },
    {
      queue: QUEUE_NAMES.runtimeReconcile,
      processor: async (job: Job) => {
        validateJob(job);
        await runWithProcessorOrStub({
          job,
          logger,
          queue: QUEUE_NAMES.runtimeReconcile,
          run: options?.runtimeReconcileProcessor ? () => options.runtimeReconcileProcessor!(job, logger) : undefined,
        });
      },
    },
  ];

  for (const def of defs) {
    const worker = new Worker(def.queue, def.processor, {
      connection,
      concurrency: Number(process.env.WORKER_CONCURRENCY ?? "5"),
      autorun: true,
      stalledInterval: 30_000,
      lockDuration: lockMsByQueue[def.queue] ?? 60_000,
    });

    worker.on("completed", (job) => {
      logger.info({ jobId: job.id, name: job.name, queue: def.queue }, "job_completed");
    });

    worker.on("failed", async (job, err) => {
      if (!job) return;
      const maxAttempts = job.opts.attempts ?? DEFAULT_JOB_OPTIONS.attempts ?? 1;
      logger.warn(
        {
          jobId: job.id,
          name: job.name,
          queue: def.queue,
          attemptsMade: job.attemptsMade,
          maxAttempts,
          err: err instanceof Error ? err.message : String(err),
        },
        "job_failed_attempt",
      );
      if (job.attemptsMade >= maxAttempts) {
        logger.error({ jobId: job.id, name: job.name, queue: def.queue }, "job_exhausted_forward_dlq");
        await forwardToDlq(connection, def.queue, job, err);
      }
    });

    workers.push(worker);
  }

  return {
    workers,
    async close() {
      await Promise.all(workers.map((w) => w.close()));
    },
  };
}
