import type { FastifyInstance } from "fastify";
import { prisma } from "@botmate/database";
import {
  ProductEventBodySchema,
  ProductEventResponseSchema,
  ProductFeedbackBodySchema,
  ProductFeedbackResponseSchema,
  TenantActivationSnapshotSchema,
} from "@botmate/shared";
import {
  buildTenantActivationSnapshot,
  bumpProductFeedbackSubmitted,
  isProductAnalyticsEnabled,
  recordProductEvent,
} from "@botmate/runtime";
import { authenticate } from "../auth.js";
import { requireWorkspaceAuth } from "../workspace-auth.js";

function analyticsDisabled(reply: { code: (n: number) => { send: (b: unknown) => unknown } }, traceId: string) {
  return reply.code(503).send({
    error: {
      code: "PRODUCT_ANALYTICS_DISABLED",
      message: "Product analytics is disabled",
      trace_id: traceId,
    },
  });
}

export function registerProductAnalyticsRoutes(app: FastifyInstance): void {
  app.get("/api/v1/product/activation", { preHandler: authenticate }, async (request, reply) => {
    if (!isProductAnalyticsEnabled()) return analyticsDisabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "FORBIDDEN_001",
          message: "Workspace auth required",
          trace_id: request.id,
        },
      });
    }

    const snapshot = await buildTenantActivationSnapshot(prisma, auth.tenantId);
    return TenantActivationSnapshotSchema.parse(snapshot);
  });

  app.post("/api/v1/product/events", { preHandler: authenticate }, async (request, reply) => {
    if (!isProductAnalyticsEnabled()) return analyticsDisabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "FORBIDDEN_001",
          message: "Workspace auth required",
          trace_id: request.id,
        },
      });
    }

    const parsed = ProductEventBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const body = parsed.data;
    const result = await recordProductEvent({
      prisma,
      tenantId: auth.tenantId,
      userId: auth.userId,
      name: body.name,
      dedupeKey: body.dedupeKey,
      route: body.route,
      props: body.props,
    });

    return ProductEventResponseSchema.parse({
      ok: true,
      recorded: result.recorded,
      deduped: result.deduped,
    });
  });

  app.post("/api/v1/product/feedback", { preHandler: authenticate }, async (request, reply) => {
    if (!isProductAnalyticsEnabled()) return analyticsDisabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "FORBIDDEN_001",
          message: "Workspace auth required",
          trace_id: request.id,
        },
      });
    }

    const parsed = ProductFeedbackBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const body = parsed.data;
    const row = await prisma.productFeedback.create({
      data: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        category: body.category,
        message: body.message.trim(),
        route: body.route ?? null,
      },
    });
    bumpProductFeedbackSubmitted();

    return ProductFeedbackResponseSchema.parse({ ok: true, id: row.id });
  });
}
