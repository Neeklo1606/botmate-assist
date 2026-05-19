import type { FastifyInstance } from "fastify";
import { prisma } from "@botmate/database";
import {
  IntegrationOpenAiStatusSchema,
  PlanEntitlementsSchema,
  WorkspaceMembersResponseSchema,
  WorkspaceOverviewSchema,
  WorkspaceSupportDiagnosticsV2Schema,
  WorkspaceUsageSummarySchema,
} from "@botmate/shared";
import { isAssistantRunEnqueueEnabled } from "@botmate/runtime";
import { getOptionalJobQueues } from "./notifications.js";
import {
  buildTenantSupportDiagnostics,
  buildTenantUsageSummary,
  resolvePlanEntitlements,
  resolveTenantPlanTier,
} from "@botmate/runtime";
import { authenticate } from "../auth.js";
import { requireWorkspaceAuth } from "../workspace-auth.js";
import { getActiveOpenAiIntegration } from "../integrations.js";
import {
  assertTenantOperational,
  getWorkspaceOverview,
  listWorkspaceMembers,
} from "../workspace/workspace-saas-service.js";

type TenantGuardResult =
  | { ok: true; planTier: string }
  | { ok: false; code: "NOT_FOUND" | "SUSPENDED" | "ARCHIVED" };

async function loadTenantGuard(tenantId: string): Promise<TenantGuardResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { suspendedAt: true, archivedAt: true, planTier: true },
  });
  if (!tenant) return { ok: false, code: "NOT_FOUND" };
  try {
    assertTenantOperational(tenant);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "TENANT_SUSPENDED") return { ok: false, code: "SUSPENDED" };
    if (msg === "TENANT_ARCHIVED") return { ok: false, code: "ARCHIVED" };
    throw e;
  }
  return { ok: true, planTier: tenant.planTier };
}

function tenantGuardError(
  reply: { code: (n: number) => { send: (b: unknown) => unknown } },
  traceId: string,
  code: "NOT_FOUND" | "SUSPENDED" | "ARCHIVED",
) {
  if (code === "SUSPENDED") {
    return reply.code(403).send({
      error: { code: "TENANT_SUSPENDED", message: "Workspace suspended", trace_id: traceId },
    });
  }
  if (code === "ARCHIVED") {
    return reply.code(403).send({
      error: { code: "TENANT_ARCHIVED", message: "Workspace archived", trace_id: traceId },
    });
  }
  return notFound(reply, traceId);
}

function requireAdminRole(role: string): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function registerWorkspaceSaasRoutes(app: FastifyInstance): void {
  app.get("/api/v1/workspace/overview", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);
    const guard = await loadTenantGuard(auth.tenantId);
    if (!guard.ok) return tenantGuardError(reply, request.id, guard.code);

    const payload = await getWorkspaceOverview(prisma, auth.tenantId);
    return WorkspaceOverviewSchema.parse(payload);
  });

  app.get("/api/v1/workspace/usage", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);
    const guard = await loadTenantGuard(auth.tenantId);
    if (!guard.ok) return tenantGuardError(reply, request.id, guard.code);

    const usage = await buildTenantUsageSummary(prisma, auth.tenantId);
    const { entitlements: _e, ...rest } = usage;
    return WorkspaceUsageSummarySchema.parse(rest);
  });

  app.get("/api/v1/workspace/members", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);
    if (!requireAdminRole(auth.role)) {
      return reply.code(403).send({
        error: { code: "FORBIDDEN_001", message: "ADMIN or OWNER required", trace_id: request.id },
      });
    }
    const guard = await loadTenantGuard(auth.tenantId);
    if (!guard.ok) return tenantGuardError(reply, request.id, guard.code);

    const payload = await listWorkspaceMembers(prisma, auth.tenantId);
    return WorkspaceMembersResponseSchema.parse(payload);
  });

  app.get("/api/v1/workspace/support-diagnostics", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);
    const guard = await loadTenantGuard(auth.tenantId);
    if (!guard.ok) return tenantGuardError(reply, request.id, guard.code);

    const queues = getOptionalJobQueues();
    const payload = await buildTenantSupportDiagnostics(prisma, auth.tenantId, auth.userId, {
      redisConfigured: Boolean(process.env.REDIS_URL?.trim()),
      queuesAvailable: Boolean(queues),
      assistantRunEnqueueEnabled: isAssistantRunEnqueueEnabled(),
    });
    return WorkspaceSupportDiagnosticsV2Schema.parse(payload);
  });

  app.get("/api/v1/integrations/openai/status", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const row = await getActiveOpenAiIntegration(auth.userId);
    return IntegrationOpenAiStatusSchema.parse({
      ok: true,
      configured: Boolean(row),
      maskedKey: row ? "sk-…configured" : null,
    });
  });

  app.get("/api/v1/workspace/entitlements", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: { planTier: true },
    });
    if (!tenant) return notFound(reply, request.id);
    const planTier = resolveTenantPlanTier(tenant.planTier);
    return PlanEntitlementsSchema.parse(resolvePlanEntitlements(planTier));
  });
}

function forbidden(reply: { code: (n: number) => { send: (b: unknown) => unknown } }, traceId: string) {
  return reply.code(403).send({
    error: { code: "FORBIDDEN_001", message: "Workspace auth required", trace_id: traceId },
  });
}

function notFound(reply: { code: (n: number) => { send: (b: unknown) => unknown } }, traceId: string) {
  return reply.code(404).send({
    error: { code: "NOT_FOUND_001", message: "Tenant not found", trace_id: traceId },
  });
}
