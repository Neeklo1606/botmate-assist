import type { FastifyInstance } from "fastify";
import {
  CreateProjectBodySchema,
  PatchProjectBodySchema,
  ProjectsListQuerySchema,
} from "@botmate/shared";
import { authenticate } from "../auth.js";
import {
  archiveProjectService,
  createProjectService,
  getProjectService,
  listProjectsService,
  patchProjectService,
  requireWorkspaceAuth,
} from "../projects/service.js";

export async function registerProjectRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/projects", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "FORBIDDEN_001",
          message: "Project routes require session or JWT authentication",
          trace_id: request.id,
        },
      });
    }

    const parsed = ProjectsListQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const result = await listProjectsService(auth, {
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });
    return reply.code(200).send(result);
  });

  app.post("/api/v1/projects", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "FORBIDDEN_001",
          message: "Project routes require session or JWT authentication",
          trace_id: request.id,
        },
      });
    }

    const parsed = CreateProjectBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const created = await createProjectService(auth, parsed.data);
    return reply.code(201).send(created);
  });

  app.get("/api/v1/projects/:id", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "FORBIDDEN_001",
          message: "Project routes require session or JWT authentication",
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

    const item = await getProjectService(auth, id.trim());
    if (!item) {
      return reply.code(404).send({
        error: {
          code: "NOT_FOUND_001",
          message: "Project not found",
          trace_id: request.id,
        },
      });
    }
    return reply.code(200).send(item);
  });

  app.patch("/api/v1/projects/:id", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "FORBIDDEN_001",
          message: "Project routes require session or JWT authentication",
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

    const parsed = PatchProjectBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const updated = await patchProjectService(auth, id.trim(), parsed.data);
    if (!updated) {
      return reply.code(404).send({
        error: {
          code: "NOT_FOUND_001",
          message: "Project not found",
          trace_id: request.id,
        },
      });
    }
    return reply.code(200).send(updated);
  });

  app.delete("/api/v1/projects/:id", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "FORBIDDEN_001",
          message: "Project routes require session or JWT authentication",
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

    const ok = await archiveProjectService(auth, id.trim());
    if (!ok) {
      return reply.code(404).send({
        error: {
          code: "NOT_FOUND_001",
          message: "Project not found",
          trace_id: request.id,
        },
      });
    }
    return reply.code(200).send({ ok: true as const });
  });
}
