import { pathToFileURL } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import sensible from "@fastify/sensible";
import { authenticate } from "./auth";
import {
  maskApiKey,
  revokeOpenAiIntegration,
  upsertOpenAiIntegration,
} from "./integrations";
import { createApiKey, listApiKeys, revokeApiKey } from "./api-keys";
import { checkIpRateLimit, checkTenantRateLimit } from "./rate-limit";
import { prisma } from "@botmate/database";
import { validateApiEnv, getApiEnv } from "./env";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerProjectRoutes } from "./routes/projects.js";
import { registerAssistantRoutes } from "./routes/assistants.js";
import { registerChatRoutes } from "./routes/chat.js";
import { registerKnowledgeRoutes } from "./routes/knowledge.js";
import { registerLeadRoutes } from "./routes/leads.js";
import {
  disposeJobInfrastructure,
  getOptionalJobQueues,
  getOptionalJobQueuesAsync,
  registerNotificationRoutes,
} from "./routes/notifications.js";
import { setBrowserJobQueues } from "./browser/browser-job-gateway.js";
import { registerRealtimeTicketRoutes } from "./routes/realtime-ticket.js";
import { registerBrowserOperatorRoutes } from "./routes/browser-operator.js";
import { registerRuntimeTenantRoutes } from "./routes/runtime-tenant.js";
import { createDistributedRealtimeGateway } from "./realtime/distributed-gateway.js";
import { setRealtimeGateway } from "./realtime/gateway-registry.js";
import type { RedisBackedRealtimePubSub } from "./realtime/redis-pubsub-boundary.js";
import {
  createRedisBackedRealtimePubSub,
  probeRedisUrl,
} from "./realtime/redis-realtime-pubsub.js";
import { getRealtimeMetricsSnapshot } from "./realtime/realtime-metrics.js";
import { registerRealtimeWs } from "./realtime/register-realtime.js";
import { createMemoryRealtimeGateway } from "./realtime/memory-gateway.js";
import { registerProductionHealthRoutes } from "./control-plane/production-health-routes.js";
import { registerRuntimeHealthRoutes } from "./control-plane/runtime-health-routes.js";
import { registerProductHealthRoutes } from "./control-plane/product-health-routes.js";
import { registerProductAnalyticsRoutes } from "./routes/product-analytics.js";
import { registerWorkspaceSaasRoutes } from "./routes/workspace-saas.js";
import { registerWorkspaceMembersRoutes } from "./routes/workspace-members.js";

const MAX_BODY_BYTES = 1024 * 1024;
const IP_LIMIT_PER_MIN = Number(process.env.IP_RATE_LIMIT_PER_MIN ?? "240");

export async function buildServer() {
  const app = Fastify({ logger: true, bodyLimit: MAX_BODY_BYTES });

  const env = getApiEnv();
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
  ];

  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error("CORS origin not allowed"), false);
    },
    credentials: true,
  });
  app.register(cookie);
  app.register(sensible);

  const memoryGateway = createMemoryRealtimeGateway();
  let redisPubSub: RedisBackedRealtimePubSub | null = null;
  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl && process.env.BOTMATE_REDIS_DISABLED !== "true") {
    const redisOk = await probeRedisUrl(redisUrl);
    if (redisOk) {
      redisPubSub = createRedisBackedRealtimePubSub(redisUrl);
    } else {
      app.log.warn("[realtime] REDIS_URL unreachable — in-memory realtime only (set BOTMATE_REDIS_DISABLED=true to silence)");
    }
  }
  const realtimeGateway = createDistributedRealtimeGateway(memoryGateway, redisPubSub);
  setRealtimeGateway(realtimeGateway);
  await registerRealtimeWs(app, realtimeGateway);

  app.addHook("onClose", async () => {
    await realtimeGateway.disposeDistributedTransport?.();
    await disposeJobInfrastructure();
  });

  app.get("/health/realtime", async () => {
    const queues = getOptionalJobQueues();
    let queueCounts:
      | {
          knowledgeProcess: Record<string, number>;
          embeddingsGenerate: Record<string, number>;
          webhookDeliver: Record<string, number>;
          analyticsRollup: Record<string, number>;
          notificationsDispatch: Record<string, number>;
          assistantRun: Record<string, number>;
          toolsAsyncExecute: Record<string, number>;
          browserRun: Record<string, number>;
          browserFeedSnapshot: Record<string, number>;
          browserCleanup: Record<string, number>;
          artifactCleanup: Record<string, number>;
        }
      | undefined;

    if (queues) {
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
      ]);
      queueCounts = {
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
      };
    }

    return {
      redisPubSubEnabled: Boolean(redisPubSub),
      redisReconnectSnapshot: redisPubSub?.reconnectSnapshot() ?? null,
      bullMqQueuesEnabled: Boolean(queues),
      queueCounts,
      metrics: getRealtimeMetricsSnapshot(),
    };
  });

  app.addHook("onRequest", async (request, reply) => {
    const checked = checkIpRateLimit({
      ip: request.ip || "unknown",
      limitPerMin: IP_LIMIT_PER_MIN,
    });
    if (!checked.allowed) {
      return reply.code(429).send({
        error: {
          code: "RATE_001",
          message: "Rate limit exceeded",
          trace_id: request.id,
        },
      });
    }
  });
  app.get("/", async () => ({
    name: "botmate-api",
    ok: true,
    docs: "/health",
  }));
  app.get("/health", async () => ({ ok: true }));

  registerProductionHealthRoutes(app);
  registerRuntimeHealthRoutes(app, { redisPubSub });
  registerProductHealthRoutes(app);

  void registerAuthRoutes(app);
  void registerProjectRoutes(app);
  void registerAssistantRoutes(app);
  void registerKnowledgeRoutes(app);
  void registerChatRoutes(app);
  void registerLeadRoutes(app);
  void registerRealtimeTicketRoutes(app);
  void registerBrowserOperatorRoutes(app);
  registerRuntimeTenantRoutes(app);
  registerProductAnalyticsRoutes(app);
  registerWorkspaceSaasRoutes(app);
  registerWorkspaceMembersRoutes(app);
  void registerNotificationRoutes(app);
  await getOptionalJobQueuesAsync();
  setBrowserJobQueues(getOptionalJobQueues());

  app.post(
    "/api/v1/integrations/openai",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const auth = request.auth!;
        const body = (request.body ?? {}) as { apiKey?: string };
        if (!body.apiKey?.trim()) {
          return reply.code(400).send({
            error: {
              code: "VALIDATION_004",
              message: "apiKey is required",
              trace_id: request.id,
            },
          });
        }

        const integration = await upsertOpenAiIntegration({
          userId: auth.userId,
          apiKey: body.apiKey.trim(),
        });
        return reply.code(201).send({
          id: integration.id,
          provider: integration.provider,
          isActive: integration.isActive,
          userId: integration.userId,
          apiKeyMasked: maskApiKey(body.apiKey.trim()),
        });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: {
            code: "CONFIG_002",
            message: "Integration encryption is not configured",
            trace_id: request.id,
          },
        });
      }
    },
  );

  app.delete(
    "/api/v1/integrations/openai",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const auth = request.auth!;
        const revoked = await revokeOpenAiIntegration(auth.userId);
        if (!revoked) {
          return reply.code(404).send({
            error: {
              code: "INTEGRATION_001",
              message: "Active OpenAI integration not found for user",
              trace_id: request.id,
            },
          });
        }
        return reply.code(200).send({ revoked: true });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: {
            code: "INTEGRATION_002",
            message: "Failed to revoke integration",
            trace_id: request.id,
          },
        });
      }
    },
  );

  app.post(
    "/api/v1/api-keys",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const auth = request.auth!;
        const body = (request.body ?? {}) as {
          name?: string;
          assistantId?: string;
          allowedDomains?: string[];
          rateLimitPerMin?: number;
        };
        if (!body.name?.trim()) {
          return reply.code(400).send({
            error: {
              code: "VALIDATION_005",
              message: "name is required",
              trace_id: request.id,
            },
          });
        }

        const created = await createApiKey({
          tenantId: auth.tenantId,
          userId: auth.userId,
          name: body.name.trim(),
          assistantId: body.assistantId?.trim() || undefined,
          allowedDomains: Array.isArray(body.allowedDomains)
            ? body.allowedDomains.map((item) => item.trim()).filter(Boolean)
            : [],
          rateLimitPerMin:
            typeof body.rateLimitPerMin === "number" && body.rateLimitPerMin > 0
              ? Math.floor(body.rateLimitPerMin)
              : 60,
        });

        return reply.code(201).send({
          ...created.item,
          apiKey: created.apiKey,
        });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: {
            code: "APIKEY_001",
            message: "Failed to create api key",
            trace_id: request.id,
          },
        });
      }
    },
  );

  app.get("/api/v1/api-keys", { preHandler: authenticate }, async (request, reply) => {
    try {
      const auth = request.auth!;
      const items = await listApiKeys({
        tenantId: auth.tenantId,
        userId: auth.userId,
      });
      return reply.code(200).send({ items });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: {
          code: "APIKEY_002",
          message: "Failed to list api keys",
          trace_id: request.id,
        },
      });
    }
  });

  app.delete(
    "/api/v1/api-keys/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const auth = request.auth!;
        const params = request.params as { id?: string };
        if (!params.id) {
          return reply.code(400).send({
            error: {
              code: "VALIDATION_006",
              message: "id is required",
              trace_id: request.id,
            },
          });
        }

        const revoked = await revokeApiKey({
          id: params.id,
          tenantId: auth.tenantId,
          userId: auth.userId,
        });
        if (!revoked) {
          return reply.code(404).send({
            error: {
              code: "APIKEY_003",
              message: "api key not found",
              trace_id: request.id,
            },
          });
        }
        return reply.code(200).send({ revoked: true });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: {
            code: "APIKEY_004",
            message: "Failed to revoke api key",
            trace_id: request.id,
          },
        });
      }
    },
  );

  app.get("/api/v1/audit/tools", { preHandler: authenticate }, async (request, reply) => {
    try {
      const auth = request.auth!;
      if (auth.authType !== "jwt") {
        return reply.code(403).send({
          error: {
            code: "AUTH_005",
            message: "JWT authentication required",
            trace_id: request.id,
          },
        });
      }

      const query = (request.query ?? {}) as {
        userId?: string;
        status?: "SUCCESS" | "FAIL";
        limit?: string | number;
      };
      const status =
        query.status === "SUCCESS" || query.status === "FAIL" ? query.status : undefined;
      const parsedLimit =
        typeof query.limit === "string" ? Number(query.limit) : query.limit ?? 50;
      const limit =
        typeof parsedLimit === "number" && Number.isFinite(parsedLimit)
          ? Math.min(Math.max(Math.floor(parsedLimit), 1), 200)
          : 50;

      const rows = await prisma.toolInvocation.findMany({
        where: {
          tenantId: auth.tenantId,
          ...(query.userId?.trim() ? { userId: query.userId.trim() } : {}),
          ...(status ? { status } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          toolName: true,
          status: true,
          success: true,
          error: true,
          createdAt: true,
        },
      });

      return reply.code(200).send({
        items: rows.map((row) => ({
          toolName: row.toolName,
          status: row.status,
          success: row.success,
          error: row.error ?? null,
          createdAt: row.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: {
          code: "AUDIT_001",
          message: "Failed to fetch audit trail",
          trace_id: request.id,
        },
      });
    }
  });


  return app;
}

const isMain =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  validateApiEnv();
  buildServer()
    .then((app) => {
      const port = getApiEnv().PORT;
      return app.listen({ port, host: "0.0.0.0" });
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
