import { config } from "dotenv";
import { mkdir } from "node:fs/promises";
import { hostname } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "@botmate/database";
import {
  executeArtifactCleanupJob,
  executeBrowserCleanupJob,
  executeBrowserFeedSnapshotJob,
  executeBrowserRunJob,
  shutdownBrowserInfrastructure,
} from "@botmate/browser-runtime/worker";
import {
  closeJobQueues,
  createBullRedis,
  createConsoleStructuredLogger,
  createJobQueues,
  enqueue,
  parseWorkerEnv,
  startWorkers,
} from "@botmate/jobs";
import {
  executeAssistantRunJob,
  executeEmbeddingsGenerateJob,
  executeKnowledgeProcessJob,
  executeNotificationsDispatchJob,
  executeRuntimeReconcileJob,
  executeToolAsyncJob,
  inheritExecutionIdentity,
  mergePolicyContextSafe,
} from "@botmate/runtime";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Loads API `.env` — expects shared `REDIS_URL`, `DATABASE_URL`, `ENCRYPTION_MASTER_KEY`. */
config({ path: resolve(__dirname, "../../api/.env") });

const logger = createConsoleStructuredLogger("botmate-worker");

const knowledgeStorageRoot =
  process.env.KNOWLEDGE_STORAGE_ROOT?.trim() ||
  resolve(__dirname, "../../api/data/knowledge");

const browserArtifactRoot =
  process.env.BROWSER_ARTIFACT_ROOT?.trim() || resolve(__dirname, "../../api/data/browser");

async function main(): Promise<void> {
  const env = parseWorkerEnv();
  logger.info({ redisHostMasked: env.REDIS_URL.replace(/:[^:@]+@/, ":****@") }, "worker_boot");

  await mkdir(knowledgeStorageRoot, { recursive: true });
  await mkdir(browserArtifactRoot, { recursive: true });

  const connection = createBullRedis(env.REDIS_URL);
  const redisPublisher = connection.duplicate();
  const queues = createJobQueues(connection);

  const workerInstanceId = `${hostname()}:${process.pid}`;

  const runtime = startWorkers(connection, logger, {
    assistantProcessor: async (job, log) => {
      await executeAssistantRunJob({
        prisma,
        logger: log,
        job,
        publishRedis: async (channel, wire) => {
          await redisPublisher.publish(channel, wire);
        },
        enqueueNotification: async (payload) => {
          await enqueue.notificationsDispatch(
            queues.notificationsDispatch,
            mergePolicyContextSafe(
              inheritExecutionIdentity(
                {
                  tenantId: payload.tenantId,
                  notificationId: payload.notificationId,
                  channels: payload.channels,
                },
                payload.inheritExecutionLineage ?? null,
              ) as Record<string, unknown>,
              { parentPolicy: payload.inheritPolicyContext ?? null },
            ),
          );
        },
      });
    },
    knowledgeProcessor: async (job, log) => {
      await executeKnowledgeProcessJob({
        prisma,
        logger: log,
        job,
        storageRoot: knowledgeStorageRoot,
        enqueueEmbeddingsGenerate: async (payload) => {
          await enqueue.embeddingsGenerate(
            queues.embeddingsGenerate,
            mergePolicyContextSafe(
              inheritExecutionIdentity(
                {
                  tenantId: payload.tenantId,
                  resourceId: payload.resourceId,
                  modelHint: payload.modelHint,
                  mode: "pending_chunks",
                },
                payload.executionLineage ?? null,
              ) as Record<string, unknown>,
              { parentPolicy: payload.policyContext ?? null },
            ),
          );
        },
      });
    },
    embeddingsProcessor: async (job, log) => {
      await executeEmbeddingsGenerateJob({
        prisma,
        logger: log,
        job,
      });
    },
    notificationsProcessor: async (job, log) => {
      await executeNotificationsDispatchJob({
        prisma,
        logger: log,
        job,
        publishRedis: async (channel, wire) => {
          await redisPublisher.publish(channel, wire);
        },
      });
    },
    toolsAsyncProcessor: async (job, log) => {
      await executeToolAsyncJob({
        logger: log,
        job,
      });
    },
    browserRunProcessor: async (job, log) => {
      await executeBrowserRunJob({
        prisma,
        logger: log,
        job,
        artifactRoot: browserArtifactRoot,
        redisPublisher,
        workerInstanceId,
      });
    },
    browserFeedSnapshotProcessor: async (job, log) => {
      await executeBrowserFeedSnapshotJob({
        prisma,
        logger: log,
        job,
        artifactRoot: browserArtifactRoot,
        redisPublisher,
      });
    },
    browserCleanupProcessor: async (job, log) => {
      await executeBrowserCleanupJob({ prisma, logger: log, job });
    },
    artifactCleanupProcessor: async (job, log) => {
      await executeArtifactCleanupJob({
        prisma,
        logger: log,
        job,
        artifactRoot: browserArtifactRoot,
      });
    },
    runtimeReconcileProcessor: async (job, log) => {
      await executeRuntimeReconcileJob({
        prisma,
        logger: log,
        job,
        publishRedis: async (channel, wire) => {
          await redisPublisher.publish(channel, wire);
        },
      });
    },
  });

  let shuttingDown = false;
  async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "shutdown_begin");
    try {
      await runtime.close();
      await shutdownBrowserInfrastructure();
      await closeJobQueues(queues);
      await redisPublisher.quit().catch(() => undefined);
      await connection.quit();
      await prisma.$disconnect();
      logger.info({}, "shutdown_complete");
      process.exit(0);
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, "shutdown_failed");
      process.exit(1);
    }
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

void main().catch((err) => {
  logger.error({ err: err instanceof Error ? err.message : String(err) }, "worker_fatal");
  process.exit(1);
});
