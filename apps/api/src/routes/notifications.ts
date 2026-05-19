import type { FastifyInstance } from "fastify";
import { authenticate } from "../auth.js";
import { prisma, Prisma } from "@botmate/database";
import {
  closeJobQueues,
  createBullRedis,
  createJobQueues,
  enqueue,
} from "@botmate/jobs";
import { probeRedisUrl } from "../realtime/redis-realtime-pubsub.js";
import { mergeExecutionContextSafe, mergePolicyContextSafe } from "@botmate/runtime";

let redisSingleton: ReturnType<typeof createBullRedis> | null = null;
let queuesSingleton: ReturnType<typeof createJobQueues> | null = null;

export async function getOptionalJobQueuesAsync(): Promise<ReturnType<typeof createJobQueues> | null> {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    return null;
  }
  if (!queuesSingleton) {
    try {
      const reachable = await probeRedisUrl(url);
      if (!reachable) {
        return null;
      }
      redisSingleton = createBullRedis(url);
      queuesSingleton = createJobQueues(redisSingleton);
    } catch (err) {
      console.error("[jobs] Redis/BullMQ unavailable — background queues disabled", err);
      if (redisSingleton) {
        void redisSingleton.quit().catch(() => undefined);
        redisSingleton = null;
      }
      queuesSingleton = null;
      return null;
    }
  }
  return queuesSingleton;
}

/** Sync accessor — returns null until {@link getOptionalJobQueuesAsync} has warmed queues. */
export function getOptionalJobQueues(): ReturnType<typeof createJobQueues> | null {
  return queuesSingleton;
}

export async function disposeJobInfrastructure(): Promise<void> {
  if (queuesSingleton) {
    await closeJobQueues(queuesSingleton);
    queuesSingleton = null;
  }
  if (redisSingleton) {
    await redisSingleton.quit();
    redisSingleton = null;
  }
}

export function registerNotificationRoutes(app: FastifyInstance): void {
  app.get("/api/v1/notifications/unread-count", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    const count = await prisma.notification.count({
      where: { tenantId: auth.tenantId, userId: auth.userId, readAt: null },
    });
    return reply.send({ count });
  });

  app.get("/api/v1/notifications", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    const query = request.query as { cursor?: string; limit?: string };
    const take = Math.min(100, Math.max(1, Number(query.limit ?? "40")));

    const rows = await prisma.notification.findMany({
      where: { tenantId: auth.tenantId, userId: auth.userId },
      orderBy: { createdAt: "desc" },
      take,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    const nextCursor = rows.length === take ? rows[rows.length - 1]?.id : null;
    return reply.send({ items: rows, nextCursor });
  });

  app.patch("/api/v1/notifications/:id/read", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    const id = (request.params as { id: string }).id;
    const updated = await prisma.notification.updateMany({
      where: { id, tenantId: auth.tenantId, userId: auth.userId },
      data: { readAt: new Date(), deliveryState: "delivered" },
    });
    if (!updated.count) {
      return reply.code(404).send({
        error: {
          code: "NOTIFICATION_NOT_FOUND",
          message: "Notification not found",
          trace_id: request.id,
        },
      });
    }
    return reply.send({ ok: true });
  });

  app.post("/api/v1/notifications", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    const body = (request.body ?? {}) as {
      title?: string;
      kind?: "system" | "mention" | "job";
      body?: Record<string, unknown>;
      correlationId?: string;
      traceId?: string;
      executionId?: string;
    };
    if (!body.title?.trim()) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_NOTIFICATION_TITLE",
          message: "title is required",
          trace_id: request.id,
        },
      });
    }

    const notification = await prisma.notification.create({
      data: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        title: body.title.trim(),
        kind: body.kind ?? "system",
        body: (body.body ?? {}) as Prisma.InputJsonValue,
        correlationId: body.correlationId,
        traceId: body.traceId?.trim() ? body.traceId.trim() : body.correlationId?.trim() ? body.correlationId.trim() : null,
        executionId: body.executionId?.trim()
          ? body.executionId.trim()
          : body.traceId?.trim()
            ? body.traceId.trim()
            : body.correlationId?.trim()
              ? body.correlationId.trim()
              : null,
        deliveryState: "queued",
      },
    });

    const queues = getOptionalJobQueues();
    if (queues) {
      await enqueue.notificationsDispatch(
        queues.notificationsDispatch,
        mergePolicyContextSafe(
          mergeExecutionContextSafe({
            tenantId: auth.tenantId,
            notificationId: notification.id,
            channels: ["ws"],
            ...(notification.correlationId && typeof notification.correlationId === "string"
              ? { correlationId: notification.correlationId }
              : {}),
          }) as Record<string, unknown>,
        ) as Record<string, unknown>,
      );
    }

    return reply.code(201).send({ notification });
  });
}
