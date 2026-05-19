import type { PrismaClient } from "@botmate/database";
import { JOB_NAMES, NotificationsDispatchPayloadSchema } from "@botmate/jobs";
import { RealtimeEnvelopeSchema } from "@botmate/shared";
import { publishGovernedRealtimeToRooms } from "../realtime/governed-realtime-publish.js";
import { enforceQueueWorkerIngress } from "../policy/index.js";

export interface StructuredLoggerLike {
  info(meta: Record<string, unknown>, msg: string): void;
  warn(meta: Record<string, unknown>, msg: string): void;
  error(meta: Record<string, unknown>, msg: string): void;
}

const REALTIME_REDIS_PREFIX = "bm:rt:v1:";

function inboxRoom(tenantId: string): string {
  return `tenant:${tenantId}:inbox`;
}

/**
 * Delivers queued notifications — WS fan-out via Redis (`bm:rt:v1:{room}`) matches API realtime bridge.
 */
export async function executeNotificationsDispatchJob(input: {
  prisma: PrismaClient;
  logger: StructuredLoggerLike;
  job: { id?: string; data: unknown };
  /** Publish raw redis channel string (includes `bm:rt:v1:` prefix). */
  publishRedis?: (redisChannel: string, wireJson: string) => Promise<void>;
}): Promise<void> {
  const payload = NotificationsDispatchPayloadSchema.parse(input.job.data);

  enforceQueueWorkerIngress({
    jobName: JOB_NAMES.NOTIFICATIONS_DISPATCH,
    tenantId: payload.tenantId,
    policyContext: payload.policyContext,
    executionId: input.job.id ? `job:${input.job.id}` : undefined,
    logger: input.logger,
    dequeuePayloadRecord: { ...payload },
  });

  const note = await input.prisma.notification.findFirst({
    where: { id: payload.notificationId, tenantId: payload.tenantId },
    select: {
      id: true,
      tenantId: true,
      userId: true,
      kind: true,
      title: true,
      deliveryState: true,
      correlationId: true,
      traceId: true,
      executionId: true,
    },
  });

  if (!note) {
    input.logger.warn(
      { notificationId: payload.notificationId, tenantId: payload.tenantId },
      "notifications_dispatch_missing_row",
    );
    return;
  }

  if (note.deliveryState === "delivered") {
    input.logger.info({ notificationId: note.id }, "notifications_dispatch_idempotent_skip_already_delivered");
    return;
  }

  if (note.deliveryState !== "queued") {
    input.logger.warn(
      { notificationId: note.id, deliveryState: note.deliveryState },
      "notifications_dispatch_skip_unexpected_delivery_state",
    );
    return;
  }
  if (!payload.channels.includes("ws")) {
    input.logger.warn(
      { notificationId: note.id, channels: payload.channels },
      "notifications_dispatch_no_transport_handler",
    );
    return;
  }

  const unsupported = payload.channels.filter((c) => c !== "ws");
  if (unsupported.length > 0) {
    input.logger.warn({ channels: unsupported, notificationId: note.id }, "notifications_dispatch_channels_skipped");
  }

  if (!input.publishRedis) {
    input.logger.warn({ notificationId: note.id }, "notifications_dispatch_ws_skip_no_redis");
    return;
  }

  const envelope = RealtimeEnvelopeSchema.parse({
    v: 1,
    tenantId: payload.tenantId,
    ts: new Date().toISOString(),
    event: "notification.created",
    payload: {
      notificationId: note.id,
      kind: note.kind,
      title: note.title,
      userId: note.userId,
      correlationId: note.correlationId ?? undefined,
      traceId: note.traceId ?? undefined,
      executionId: note.executionId ?? note.traceId ?? undefined,
    },
  });
  await publishGovernedRealtimeToRooms({
    gateway: {
      publish: async (_tenantId: string, room: string, wire: string) => {
        const channel = `${REALTIME_REDIS_PREFIX}${room}`;
        await input.publishRedis!(channel, wire);
      },
    },
    publishTenantId: payload.tenantId,
    rooms: [inboxRoom(payload.tenantId)],
    envelope,
    wireMode: "event_frame",
    governanceSurfaceId: "surface.worker.notifications.redis_fanout",
  });

  await input.prisma.notification.updateMany({
    where: { id: note.id, tenantId: payload.tenantId, deliveryState: "queued" },
    data: { deliveryState: "delivered" },
  });

  input.logger.info({ notificationId: note.id, tenantId: payload.tenantId }, "notifications_dispatch_complete");
}
