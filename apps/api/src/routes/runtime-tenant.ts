import type { FastifyInstance, FastifyReply } from "fastify";
import { prisma } from "@botmate/database";
import {
  RuntimeBrowserSessionsQuerySchema,
  RuntimeBrowserSessionsResponseSchema,
  RuntimeExecutionDetailSchema,
  RuntimeExecutionsQuerySchema,
  RuntimeExecutionsResponseSchema,
  RuntimeNotificationsQuerySchema,
  RuntimeNotificationsResponseSchema,
  RuntimeOverviewResponseSchema,
  RuntimePolicyEventsQuerySchema,
  RuntimePolicyEventsResponseSchema,
  ExecutionTimelineQuerySchema,
  ExecutionTimelineResponseSchema,
  RuntimeQueuesResponseSchema,
  ExecutionGraphResponseSchema,
  ExecutionFactsQuerySchema,
  ExecutionFactsResponseSchema,
  RuntimeArtifactsQuerySchema,
  RuntimeArtifactsListResponseSchema,
  RuntimeArtifactDetailResponseSchema,
  RuntimeConsistencyReportSchema,
  ReplayVisibilityMatrixSchema,
} from "@botmate/shared";
import { authenticate } from "../auth.js";
import { requireWorkspaceAuth } from "../workspace-auth.js";
import {
  buildRuntimeOverview,
  getRuntimeExecutionDetail,
  listRuntimeBrowserSessions,
  listRuntimeExecutions,
  listRuntimeNotifications,
  listRuntimePolicyEvents,
} from "../runtime-tenant/runtime-tenant-service.js";
import { getExecutionTimeline } from "../runtime-tenant/runtime-tenant-timeline.js";
import { listTenantRuntimeQueues } from "../runtime-tenant/runtime-tenant-queues.js";
import { getExecutionGraph } from "../runtime-tenant/runtime-tenant-graph.js";
import { listExecutionFactsPage } from "../runtime-tenant/runtime-tenant-facts.js";
import { streamRuntimeArtifactBinary } from "../runtime-tenant/runtime-tenant-artifact-binary.js";
import { getRuntimeArtifactDetail, listRuntimeArtifacts } from "../runtime-tenant/runtime-tenant-artifacts.js";
import { getRuntimeConsistencyDiagnostics } from "../runtime-tenant/runtime-tenant-consistency.js";
import { getReplayVisibilityMatrix } from "../runtime-tenant/runtime-tenant-replay-matrix.js";
import { registerRuntimeTenantPhase9fRoutes } from "../runtime-tenant/runtime-tenant-phase9f.js";

function runtimeTenantApiEnabled(): boolean {
  return process.env.BOTMATE_RUNTIME_TENANT_API?.trim() !== "false";
}

function forbidden(reply: FastifyReply, traceId: string) {
  return reply.code(403).send({
    error: {
      code: "FORBIDDEN_001",
      message: "Runtime routes require workspace session authentication",
      trace_id: traceId,
    },
  });
}

function disabled(reply: FastifyReply, traceId: string) {
  return reply.code(403).send({
    error: {
      code: "RUNTIME_API_DISABLED",
      message: "Tenant runtime API disabled via BOTMATE_RUNTIME_TENANT_API=false",
      trace_id: traceId,
    },
  });
}

export function registerRuntimeTenantRoutes(app: FastifyInstance): void {
  app.get("/api/v1/runtime/overview", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const payload = await buildRuntimeOverview({
      prisma,
      tenantId: auth.tenantId,
      userId: auth.userId,
    });
    return RuntimeOverviewResponseSchema.parse(payload);
  });

  app.get("/api/v1/runtime/executions", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const parsed = RuntimeExecutionsQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }
    const q = parsed.data;
    const payload = await listRuntimeExecutions({
      prisma,
      tenantId: auth.tenantId,
      page: q.page,
      pageSize: q.pageSize,
      assistantId: q.assistantId,
    });
    return RuntimeExecutionsResponseSchema.parse(payload);
  });

  app.get("/api/v1/runtime/executions/:executionId/timeline", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const executionId = (request.params as { executionId: string }).executionId;
    if (!executionId?.trim()) {
      return reply.code(400).send({
        error: { code: "VALIDATION_EXECUTION_ID", message: "executionId required", trace_id: request.id },
      });
    }

    const parsed = ExecutionTimelineQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const payload = await getExecutionTimeline({
      prisma,
      tenantId: auth.tenantId,
      userId: auth.userId,
      executionKey: executionId.trim(),
      query: parsed.data,
    });
    if (!payload) {
      return reply.code(404).send({
        error: { code: "RUNTIME_EXECUTION_NOT_FOUND", message: "Execution not found", trace_id: request.id },
      });
    }
    return ExecutionTimelineResponseSchema.parse(payload);
  });

  app.get("/api/v1/runtime/executions/:executionId/graph", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const executionId = (request.params as { executionId: string }).executionId;
    if (!executionId?.trim()) {
      return reply.code(400).send({
        error: { code: "VALIDATION_EXECUTION_ID", message: "executionId required", trace_id: request.id },
      });
    }

    const payload = await getExecutionGraph({
      prisma,
      tenantId: auth.tenantId,
      executionKey: executionId.trim(),
    });
    if (!payload) {
      return reply.code(404).send({
        error: { code: "RUNTIME_EXECUTION_NOT_FOUND", message: "Execution not found", trace_id: request.id },
      });
    }
    return ExecutionGraphResponseSchema.parse(payload);
  });

  app.get("/api/v1/runtime/executions/:executionId/facts", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const executionId = (request.params as { executionId: string }).executionId;
    if (!executionId?.trim()) {
      return reply.code(400).send({
        error: { code: "VALIDATION_EXECUTION_ID", message: "executionId required", trace_id: request.id },
      });
    }

    const parsed = ExecutionFactsQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const payload = await listExecutionFactsPage({
      prisma,
      tenantId: auth.tenantId,
      executionKey: executionId.trim(),
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });
    if (!payload) {
      return reply.code(404).send({
        error: { code: "RUNTIME_EXECUTION_NOT_FOUND", message: "Execution not found", trace_id: request.id },
      });
    }
    return ExecutionFactsResponseSchema.parse(payload);
  });

  app.get("/api/v1/runtime/executions/:executionId/replay-matrix", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const executionId = (request.params as { executionId: string }).executionId;
    if (!executionId?.trim()) {
      return reply.code(400).send({
        error: { code: "VALIDATION_EXECUTION_ID", message: "executionId required", trace_id: request.id },
      });
    }

    const payload = await getReplayVisibilityMatrix({
      prisma,
      tenantId: auth.tenantId,
      executionKey: executionId.trim(),
    });
    if (!payload) {
      return reply.code(404).send({
        error: { code: "RUNTIME_EXECUTION_NOT_FOUND", message: "Execution not found", trace_id: request.id },
      });
    }
    return ReplayVisibilityMatrixSchema.parse(payload);
  });

  app.get("/api/v1/runtime/executions/:executionId", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const executionId = (request.params as { executionId: string }).executionId;
    if (!executionId?.trim()) {
      return reply.code(400).send({
        error: { code: "VALIDATION_EXECUTION_ID", message: "executionId required", trace_id: request.id },
      });
    }

    const payload = await getRuntimeExecutionDetail({
      prisma,
      tenantId: auth.tenantId,
      executionKey: executionId.trim(),
    });
    if (!payload) {
      return reply.code(404).send({
        error: { code: "RUNTIME_EXECUTION_NOT_FOUND", message: "Execution not found", trace_id: request.id },
      });
    }
    return RuntimeExecutionDetailSchema.parse(payload);
  });

  app.get("/api/v1/runtime/browser-sessions", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const parsed = RuntimeBrowserSessionsQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }
    const q = parsed.data;
    const payload = await listRuntimeBrowserSessions({
      prisma,
      tenantId: auth.tenantId,
      page: q.page,
      pageSize: q.pageSize,
    });
    return RuntimeBrowserSessionsResponseSchema.parse(payload);
  });

  app.get("/api/v1/runtime/notifications", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const parsed = RuntimeNotificationsQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }
    const q = parsed.data;
    const payload = await listRuntimeNotifications({
      prisma,
      tenantId: auth.tenantId,
      userId: auth.userId,
      page: q.page,
      pageSize: q.pageSize,
    });
    return RuntimeNotificationsResponseSchema.parse(payload);
  });

  app.get("/api/v1/runtime/policy-events", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const parsed = RuntimePolicyEventsQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }
    const q = parsed.data;
    const payload = await listRuntimePolicyEvents({
      prisma,
      tenantId: auth.tenantId,
      page: q.page,
      pageSize: q.pageSize,
    });
    return RuntimePolicyEventsResponseSchema.parse(payload);
  });

  app.get("/api/v1/runtime/queues", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const payload = await listTenantRuntimeQueues({
      prisma,
      tenantId: auth.tenantId,
    });
    return RuntimeQueuesResponseSchema.parse(payload);
  });

  app.get("/api/v1/runtime/artifacts", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const parsed = RuntimeArtifactsQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const payload = await listRuntimeArtifacts({
      prisma,
      tenantId: auth.tenantId,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      browserSessionId: parsed.data.browserSessionId,
    });
    return RuntimeArtifactsListResponseSchema.parse(payload);
  });

  app.get("/api/v1/runtime/artifacts/:artifactId/binary", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const artifactId = (request.params as { artifactId: string }).artifactId;
    if (!artifactId?.trim()) {
      return reply.code(400).send({
        error: { code: "VALIDATION_ARTIFACT_ID", message: "artifactId required", trace_id: request.id },
      });
    }

    await streamRuntimeArtifactBinary({
      prisma,
      tenantId: auth.tenantId,
      artifactId: artifactId.trim(),
      reply,
      traceId: request.id,
    });
  });

  app.get("/api/v1/runtime/artifacts/:artifactId", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const artifactId = (request.params as { artifactId: string }).artifactId;
    if (!artifactId?.trim()) {
      return reply.code(400).send({
        error: { code: "VALIDATION_ARTIFACT_ID", message: "artifactId required", trace_id: request.id },
      });
    }

    const payload = await getRuntimeArtifactDetail({
      prisma,
      tenantId: auth.tenantId,
      artifactId: artifactId.trim(),
    });
    if (!payload) {
      return reply.code(404).send({
        error: { code: "RUNTIME_ARTIFACT_NOT_FOUND", message: "Artifact not found", trace_id: request.id },
      });
    }
    return RuntimeArtifactDetailResponseSchema.parse(payload);
  });

  app.get("/api/v1/runtime/consistency", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const payload = await getRuntimeConsistencyDiagnostics({
      prisma,
      tenantId: auth.tenantId,
    });
    return RuntimeConsistencyReportSchema.parse(payload);
  });

  registerRuntimeTenantPhase9fRoutes(app);
}
