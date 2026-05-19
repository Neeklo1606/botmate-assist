import type { FastifyInstance } from "fastify";
import {
  AssistantsListQuerySchema,
  AssistantArchiveResponseSchema,
  CreateAssistantBodySchema,
  PatchAssistantBodySchema,
} from "@botmate/shared";
import { authenticate } from "../auth.js";
import {
  archiveAssistantService,
  createAssistantService,
  getAssistantService,
  listAssistantsService,
  patchAssistantService,
} from "../assistants/service.js";
import { requireWorkspaceAuth } from "../workspace-auth.js";

export async function registerAssistantRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/assistants", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "FORBIDDEN_001",
          message: "Assistant routes require session or JWT authentication",
          trace_id: request.id,
        },
      });
    }

    const parsed = AssistantsListQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const result = await listAssistantsService(auth, {
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });
    return reply.code(200).send(result);
  });

  app.post("/api/v1/assistants", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "FORBIDDEN_001",
          message: "Assistant routes require session or JWT authentication",
          trace_id: request.id,
        },
      });
    }

    const parsed = CreateAssistantBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    try {
      const created = await createAssistantService(auth, parsed.data);
      return reply.code(201).send(created);
    } catch (error) {
      const { PlanLimitError, TenantOperationalError } = await import("@botmate/runtime");
      if (error instanceof PlanLimitError || error instanceof TenantOperationalError) {
        const { sendCommercialError } = await import("../workspace/commercial-errors.js");
        return sendCommercialError(reply, error, request.id);
      }
      if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") {
        return reply.code(404).send({
          error: {
            code: "NOT_FOUND_001",
            message: "Project not found",
            trace_id: request.id,
          },
        });
      }
      throw error;
    }
  });

  app.get("/api/v1/assistants/:id", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "FORBIDDEN_001",
          message: "Assistant routes require session or JWT authentication",
          trace_id: request.id,
        },
      });
    }

    const { id } = request.params as { id?: string };
    if (!id?.trim()) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: "id is required",
          trace_id: request.id,
        },
      });
    }

    const item = await getAssistantService(auth, id.trim());
    if (!item) {
      return reply.code(404).send({
        error: {
          code: "NOT_FOUND_001",
          message: "Assistant not found",
          trace_id: request.id,
        },
      });
    }
    return reply.code(200).send(item);
  });

  app.patch("/api/v1/assistants/:id", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "FORBIDDEN_001",
          message: "Assistant routes require session or JWT authentication",
          trace_id: request.id,
        },
      });
    }

    const { id } = request.params as { id?: string };
    if (!id?.trim()) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: "id is required",
          trace_id: request.id,
        },
      });
    }

    const parsed = PatchAssistantBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    try {
      const updated = await patchAssistantService(auth, id.trim(), parsed.data);
      if (!updated) {
        return reply.code(404).send({
          error: {
            code: "NOT_FOUND_001",
            message: "Assistant not found",
            trace_id: request.id,
          },
        });
      }
      return reply.code(200).send(updated);
    } catch (error) {
      if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") {
        return reply.code(404).send({
          error: {
            code: "NOT_FOUND_001",
            message: "Project not found",
            trace_id: request.id,
          },
        });
      }
      throw error;
    }
  });

  app.delete("/api/v1/assistants/:id", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "FORBIDDEN_001",
          message: "Assistant routes require session or JWT authentication",
          trace_id: request.id,
        },
      });
    }

    const { id } = request.params as { id?: string };
    if (!id?.trim()) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: "id is required",
          trace_id: request.id,
        },
      });
    }

    const ok = await archiveAssistantService(auth, id.trim());
    if (!ok) {
      return reply.code(404).send({
        error: {
          code: "NOT_FOUND_001",
          message: "Assistant not found",
          trace_id: request.id,
        },
      });
    }
    return reply.code(200).send(AssistantArchiveResponseSchema.parse({ ok: true }));
  });
}
