import type { FastifyInstance } from "fastify";
import { prisma } from "@botmate/database";
import {
  AcceptInviteRequestSchema,
  AcceptInviteResponseSchema,
  WorkspaceInviteCreateBodySchema,
  WorkspaceInviteCreateResponseSchema,
  WorkspaceInvitesResponseSchema,
  WorkspaceMemberPatchBodySchema,
  WorkspaceOnboardingStateSchema,
} from "@botmate/shared";
import { getTenantWorkspaceState } from "@botmate/runtime";
import { authenticate } from "../auth.js";
import { requireWorkspaceAuth } from "../workspace-auth.js";
import { sendCommercialError } from "../workspace/commercial-errors.js";
import {
  acceptWorkspaceInvite,
  createWorkspaceInvite,
  listWorkspaceInvites,
  revokeWorkspaceInvite,
} from "../workspace/invite-service.js";
import { removeMember, updateMemberRole } from "../workspace/member-service.js";
import {
  assertTenantOperational,
  getWorkspaceOverview,
} from "../workspace/workspace-saas-service.js";
import { establishSessionFromUser } from "./workspace-members-session.js";

async function loadTenantGuard(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { suspendedAt: true, archivedAt: true },
  });
  if (!tenant) return { ok: false as const, code: "NOT_FOUND" as const };
  try {
    assertTenantOperational(tenant);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "TENANT_SUSPENDED") return { ok: false as const, code: "SUSPENDED" as const };
    if (msg === "TENANT_ARCHIVED") return { ok: false as const, code: "ARCHIVED" as const };
    throw e;
  }
  return { ok: true as const };
}

function requireAdminRole(role: string): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function registerWorkspaceMembersRoutes(app: FastifyInstance): void {
  app.get("/api/v1/workspace/onboarding", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: { code: "FORBIDDEN_001", message: "Workspace auth required", trace_id: request.id },
      });
    }
    const guard = await loadTenantGuard(auth.tenantId);
    if (!guard.ok) {
      return reply.code(403).send({
        error: { code: `TENANT_${guard.code}`, message: "Workspace unavailable", trace_id: request.id },
      });
    }
    try {
      const state = await getTenantWorkspaceState(prisma, auth.tenantId);
      return WorkspaceOnboardingStateSchema.parse({
        ok: true,
        lifecycleStage: state.lifecycleStage,
        onboardingCompletedAt: state.onboardingCompletedAt?.toISOString() ?? null,
        onboardingSteps: state.onboardingSteps,
        recommendedActions: state.recommendedActions,
      });
    } catch (err) {
      return sendCommercialError(reply, err, request.id);
    }
  });

  app.post("/api/v1/workspace/invites", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth) || !requireAdminRole(auth.role)) {
      return reply.code(403).send({
        error: { code: "FORBIDDEN_001", message: "ADMIN or OWNER required", trace_id: request.id },
      });
    }
    const parsed = WorkspaceInviteCreateBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: { code: "VALIDATION_001", message: parsed.error.message, trace_id: request.id },
      });
    }
    try {
      const result = await createWorkspaceInvite(prisma, {
        tenantId: auth.tenantId,
        invitedByUserId: auth.userId,
        email: parsed.data.email,
        role: parsed.data.role,
      });
      return WorkspaceInviteCreateResponseSchema.parse({
        ok: true,
        invite: {
          id: result.invite.id,
          email: result.invite.email,
          role: result.invite.role,
          status: result.status,
          expiresAt: result.invite.expiresAt.toISOString(),
          createdAt: result.invite.createdAt.toISOString(),
          inviteUrl: result.inviteUrl,
        },
        emailPreview: result.emailPreview,
      });
    } catch (err) {
      return sendCommercialError(reply, err, request.id);
    }
  });

  app.get("/api/v1/workspace/invites", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth) || !requireAdminRole(auth.role)) {
      return reply.code(403).send({
        error: { code: "FORBIDDEN_001", message: "ADMIN or OWNER required", trace_id: request.id },
      });
    }
    const items = await listWorkspaceInvites(prisma, auth.tenantId);
    return WorkspaceInvitesResponseSchema.parse({ ok: true, items });
  });

  app.delete("/api/v1/workspace/invites/:inviteId", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth) || !requireAdminRole(auth.role)) {
      return reply.code(403).send({
        error: { code: "FORBIDDEN_001", message: "ADMIN or OWNER required", trace_id: request.id },
      });
    }
    const inviteId = (request.params as { inviteId: string }).inviteId;
    try {
      await revokeWorkspaceInvite(prisma, auth.tenantId, inviteId);
      return { ok: true };
    } catch (err) {
      return sendCommercialError(reply, err, request.id);
    }
  });

  app.patch("/api/v1/workspace/members/:userId", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth) || !requireAdminRole(auth.role)) {
      return reply.code(403).send({
        error: { code: "FORBIDDEN_001", message: "ADMIN or OWNER required", trace_id: request.id },
      });
    }
    const parsed = WorkspaceMemberPatchBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: { code: "VALIDATION_001", message: parsed.error.message, trace_id: request.id },
      });
    }
    const userId = (request.params as { userId: string }).userId;
    try {
      const row = await updateMemberRole(prisma, {
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        actorRole: auth.role,
        targetUserId: userId,
        newRole: parsed.data.role,
      });
      return {
        ok: true,
        member: {
          id: row.id,
          email: row.email,
          fullName: row.fullName,
          role: row.role,
          createdAt: row.createdAt.toISOString(),
        },
      };
    } catch (err) {
      return sendCommercialError(reply, err, request.id);
    }
  });

  app.delete("/api/v1/workspace/members/:userId", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth) || !requireAdminRole(auth.role)) {
      return reply.code(403).send({
        error: { code: "FORBIDDEN_001", message: "ADMIN or OWNER required", trace_id: request.id },
      });
    }
    const userId = (request.params as { userId: string }).userId;
    try {
      await removeMember(prisma, {
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        actorRole: auth.role,
        targetUserId: userId,
      });
      return { ok: true };
    } catch (err) {
      return sendCommercialError(reply, err, request.id);
    }
  });

  app.post("/api/v1/auth/accept-invite", async (request, reply) => {
    const parsed = AcceptInviteRequestSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: { code: "VALIDATION_001", message: parsed.error.message, trace_id: request.id },
      });
    }
    try {
      const result = await acceptWorkspaceInvite(prisma, parsed.data);
      return establishSessionFromUser(request, reply.code(201), result.user);
    } catch (err) {
      return sendCommercialError(reply, err, request.id);
    }
  });
}
