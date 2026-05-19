import type { FastifyInstance } from "fastify";
import {
  CreateLeadBodySchema,
  LeadArchiveResponseSchema,
  LeadsListQuerySchema,
  PatchLeadBodySchema,
} from "@botmate/shared";
import { authenticate } from "../auth.js";
import { checkTenantRateLimit } from "../rate-limit.js";
import { requireWorkspaceAuth } from "../workspace-auth.js";
import {
  archiveWorkspaceLead,
  createWorkspaceLead,
  getWorkspaceLead,
  listWorkspaceLeads,
  patchWorkspaceLead,
} from "../leads/lead-service.js";

const TENANT_REQUESTS_PER_MIN = Number(process.env.TENANT_REQUESTS_PER_MIN ?? "60");

function forbiddenWorkspace(reply: { code: (n: number) => { send: (b: unknown) => unknown } }, traceId: string) {
  return reply.code(403).send({
    error: {
      code: "FORBIDDEN_001",
      message: "Lead routes require session or JWT authentication",
      trace_id: traceId,
    },
  });
}

export async function registerLeadRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/leads", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbiddenWorkspace(reply, request.id);

    const parsed = LeadsListQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const tenantCheck = checkTenantRateLimit({
      tenantId: auth.tenantId,
      limitPerMin: TENANT_REQUESTS_PER_MIN,
      scope: "crud",
    });
    if (!tenantCheck.allowed) {
      return reply.code(429).send({
        error: {
          code: "RATE_001",
          message: "Rate limit exceeded",
          trace_id: request.id,
        },
      });
    }

    const result = await listWorkspaceLeads(auth, parsed.data);
    return reply.code(200).send(result);
  });

  app.post("/api/v1/leads", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbiddenWorkspace(reply, request.id);

    const parsed = CreateLeadBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const tenantCheck = checkTenantRateLimit({
      tenantId: auth.tenantId,
      limitPerMin: TENANT_REQUESTS_PER_MIN,
      scope: "crud",
    });
    if (!tenantCheck.allowed) {
      return reply.code(429).send({
        error: {
          code: "RATE_001",
          message: "Rate limit exceeded",
          trace_id: request.id,
        },
      });
    }

    try {
      const created = await createWorkspaceLead(auth, parsed.data);
      return reply.code(201).send(created);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "ASSISTANT_NOT_FOUND") {
        return reply.code(404).send({
          error: { code: "ASSISTANT_001", message: "Assistant not found for tenant", trace_id: request.id },
        });
      }
      if (code === "PROJECT_NOT_FOUND") {
        return reply.code(404).send({
          error: { code: "PROJECT_001", message: "Project not found for tenant", trace_id: request.id },
        });
      }
      if (code === "SESSION_NOT_FOUND") {
        return reply.code(404).send({
          error: { code: "CHAT_001", message: "Chat session not found for tenant", trace_id: request.id },
        });
      }
      if (code === "USER_NOT_FOUND") {
        return reply.code(404).send({
          error: { code: "USER_001", message: "User not found for tenant", trace_id: request.id },
        });
      }
      request.log.error(error);
      return reply.code(500).send({
        error: { code: "LEAD_002", message: "Failed to create lead", trace_id: request.id },
      });
    }
  });

  app.get("/api/v1/leads/:leadId", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbiddenWorkspace(reply, request.id);

    const { leadId } = request.params as { leadId: string };
    const tenantCheck = checkTenantRateLimit({
      tenantId: auth.tenantId,
      limitPerMin: TENANT_REQUESTS_PER_MIN,
      scope: "crud",
    });
    if (!tenantCheck.allowed) {
      return reply.code(429).send({
        error: {
          code: "RATE_001",
          message: "Rate limit exceeded",
          trace_id: request.id,
        },
      });
    }

    const row = await getWorkspaceLead(auth, leadId);
    if (!row) {
      return reply.code(404).send({
        error: { code: "LEAD_001", message: "Lead not found", trace_id: request.id },
      });
    }
    return reply.code(200).send(row);
  });

  app.patch("/api/v1/leads/:leadId", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbiddenWorkspace(reply, request.id);

    const { leadId } = request.params as { leadId: string };
    const parsed = PatchLeadBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const tenantCheck = checkTenantRateLimit({
      tenantId: auth.tenantId,
      limitPerMin: TENANT_REQUESTS_PER_MIN,
      scope: "crud",
    });
    if (!tenantCheck.allowed) {
      return reply.code(429).send({
        error: {
          code: "RATE_001",
          message: "Rate limit exceeded",
          trace_id: request.id,
        },
      });
    }

    try {
      const updated = await patchWorkspaceLead(auth, leadId, parsed.data);
      if (!updated) {
        return reply.code(404).send({
          error: { code: "LEAD_001", message: "Lead not found", trace_id: request.id },
        });
      }
      return reply.code(200).send(updated);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "ASSISTANT_NOT_FOUND") {
        return reply.code(404).send({
          error: { code: "ASSISTANT_001", message: "Assistant not found for tenant", trace_id: request.id },
        });
      }
      if (code === "PROJECT_NOT_FOUND") {
        return reply.code(404).send({
          error: { code: "PROJECT_001", message: "Project not found for tenant", trace_id: request.id },
        });
      }
      if (code === "SESSION_NOT_FOUND") {
        return reply.code(404).send({
          error: { code: "CHAT_001", message: "Chat session not found for tenant", trace_id: request.id },
        });
      }
      if (code === "USER_NOT_FOUND") {
        return reply.code(404).send({
          error: { code: "USER_001", message: "User not found for tenant", trace_id: request.id },
        });
      }
      request.log.error(error);
      return reply.code(500).send({
        error: { code: "LEAD_003", message: "Failed to update lead", trace_id: request.id },
      });
    }
  });

  app.delete("/api/v1/leads/:leadId", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbiddenWorkspace(reply, request.id);

    const { leadId } = request.params as { leadId: string };

    const tenantCheck = checkTenantRateLimit({
      tenantId: auth.tenantId,
      limitPerMin: TENANT_REQUESTS_PER_MIN,
      scope: "crud",
    });
    if (!tenantCheck.allowed) {
      return reply.code(429).send({
        error: {
          code: "RATE_001",
          message: "Rate limit exceeded",
          trace_id: request.id,
        },
      });
    }

    const ok = await archiveWorkspaceLead(auth, leadId);
    if (!ok) {
      return reply.code(404).send({
        error: { code: "LEAD_001", message: "Lead not found", trace_id: request.id },
      });
    }
    return reply.code(200).send(LeadArchiveResponseSchema.parse({ ok: true as const }));
  });
}
