import type { FastifyInstance } from "fastify";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "@botmate/database";
import { enqueue } from "@botmate/jobs";
import {
  KNOWLEDGE_MAX_UPLOAD_BYTES,
  mergeExecutionContextSafe,
  mergePolicyContextSafe,
} from "@botmate/runtime";
import { authenticate } from "../auth.js";
import { requireWorkspaceAuth } from "../workspace-auth.js";
import { getOptionalJobQueues } from "./notifications.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function storageRootDir(): string {
  return (
    process.env.KNOWLEDGE_STORAGE_ROOT?.trim() ||
    resolve(__dirname, "../../data/knowledge")
  );
}

const ALLOWED_MIME = new Set([
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function registerKnowledgeRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/knowledge/bases", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "FORBIDDEN_001",
          message: "Knowledge routes require session or JWT authentication",
          trace_id: request.id,
        },
      });
    }

    const rows = await prisma.knowledgeBase.findMany({
      where: { tenantId: auth.tenantId, archivedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        assistantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return reply.code(200).send({ items: rows });
  });

  app.post("/api/v1/knowledge/bases", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "FORBIDDEN_001",
          message: "Knowledge routes require session or JWT authentication",
          trace_id: request.id,
        },
      });
    }

    const body = (request.body ?? {}) as { name?: string; assistantId?: string | null };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return reply.code(400).send({
        error: { code: "VALIDATION_KB_001", message: "name is required", trace_id: request.id },
      });
    }

    let assistantId: string | null = null;
    if (typeof body.assistantId === "string" && body.assistantId.trim()) {
      const assistant = await prisma.assistant.findFirst({
        where: { id: body.assistantId.trim(), tenantId: auth.tenantId, archivedAt: null },
        select: { id: true },
      });
      if (!assistant) {
        return reply.code(404).send({
          error: { code: "NOT_FOUND_ASSISTANT", message: "Assistant not found", trace_id: request.id },
        });
      }
      assistantId = assistant.id;
    }

    const row = await prisma.knowledgeBase.create({
      data: {
        tenantId: auth.tenantId,
        assistantId,
        name,
      },
      select: { id: true, name: true, assistantId: true, createdAt: true, updatedAt: true },
    });

    return reply.code(201).send(row);
  });

  app.get<{ Params: { baseId: string } }>(
    "/api/v1/knowledge/bases/:baseId/documents",
    { preHandler: authenticate },
    async (request, reply) => {
      const auth = request.auth!;
      if (!requireWorkspaceAuth(auth)) {
        return reply.code(403).send({
          error: {
            code: "FORBIDDEN_001",
            message: "Knowledge routes require session or JWT authentication",
            trace_id: request.id,
          },
        });
      }

      const baseId = request.params.baseId?.trim();
      if (!baseId) {
        return reply.code(400).send({
          error: { code: "VALIDATION_KB_002", message: "baseId is required", trace_id: request.id },
        });
      }

      const base = await prisma.knowledgeBase.findFirst({
        where: { id: baseId, tenantId: auth.tenantId, archivedAt: null },
        select: { id: true },
      });
      if (!base) {
        return reply.code(404).send({
          error: { code: "NOT_FOUND_KB", message: "Knowledge base not found", trace_id: request.id },
        });
      }

      const rows = await prisma.knowledgeDocument.findMany({
        where: {
          tenantId: auth.tenantId,
          knowledgeBaseId: base.id,
          archivedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          knowledgeBaseId: true,
          title: true,
          mimeType: true,
          byteSize: true,
          status: true,
          errorMessage: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 200,
      });

      return reply.code(200).send({
        items: rows.map((r) => ({
          id: r.id,
          knowledgeBaseId: r.knowledgeBaseId,
          title: r.title,
          mimeType: r.mimeType,
          byteSize: r.byteSize,
          status: r.status,
          errorMessage: r.errorMessage,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
      });
    },
  );

  app.delete<{ Params: { baseId: string; documentId: string } }>(
    "/api/v1/knowledge/bases/:baseId/documents/:documentId",
    { preHandler: authenticate },
    async (request, reply) => {
      const auth = request.auth!;
      if (!requireWorkspaceAuth(auth)) {
        return reply.code(403).send({
          error: {
            code: "FORBIDDEN_001",
            message: "Knowledge routes require session or JWT authentication",
            trace_id: request.id,
          },
        });
      }

      const baseId = request.params.baseId?.trim();
      const documentId = request.params.documentId?.trim();
      if (!baseId || !documentId) {
        return reply.code(400).send({
          error: { code: "VALIDATION_KB_007", message: "baseId and documentId are required", trace_id: request.id },
        });
      }

      const doc = await prisma.knowledgeDocument.findFirst({
        where: {
          id: documentId,
          knowledgeBaseId: baseId,
          tenantId: auth.tenantId,
          archivedAt: null,
        },
        select: { id: true },
      });
      if (!doc) {
        return reply.code(404).send({
          error: { code: "NOT_FOUND_KB_DOC", message: "Document not found", trace_id: request.id },
        });
      }

      await prisma.knowledgeDocument.update({
        where: { id: doc.id },
        data: { archivedAt: new Date() },
      });

      return reply.code(204).send();
    },
  );

  app.post<{ Params: { baseId: string } }>(
    "/api/v1/knowledge/bases/:baseId/documents",
    {
      preHandler: authenticate,
      bodyLimit: KNOWLEDGE_MAX_UPLOAD_BYTES + 512 * 1024,
    },
    async (request, reply) => {
      const auth = request.auth!;
      if (!requireWorkspaceAuth(auth)) {
        return reply.code(403).send({
          error: {
            code: "FORBIDDEN_001",
            message: "Knowledge routes require session or JWT authentication",
            trace_id: request.id,
          },
        });
      }

      const queues = getOptionalJobQueues();
      if (!queues) {
        return reply.code(503).send({
          error: {
            code: "QUEUE_UNAVAILABLE",
            message: "Redis queues are not configured — cannot ingest documents",
            trace_id: request.id,
          },
        });
      }

      const baseId = request.params.baseId?.trim();
      if (!baseId) {
        return reply.code(400).send({
          error: { code: "VALIDATION_KB_002", message: "baseId is required", trace_id: request.id },
        });
      }

      const base = await prisma.knowledgeBase.findFirst({
        where: { id: baseId, tenantId: auth.tenantId, archivedAt: null },
        select: { id: true },
      });
      if (!base) {
        return reply.code(404).send({
          error: { code: "NOT_FOUND_KB", message: "Knowledge base not found", trace_id: request.id },
        });
      }

      const body = (request.body ?? {}) as {
        title?: string;
        mimeType?: string;
        contentBase64?: string;
      };

      const title = typeof body.title === "string" ? body.title.trim() : "";
      const mimeType = typeof body.mimeType === "string" ? body.mimeType.trim().toLowerCase() : "";
      const b64 = typeof body.contentBase64 === "string" ? body.contentBase64.trim() : "";

      if (!title || !mimeType || !b64) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_KB_003",
            message: "title, mimeType, and contentBase64 are required",
            trace_id: request.id,
          },
        });
      }

      if (!ALLOWED_MIME.has(mimeType)) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_KB_004",
            message: `Unsupported mimeType — allowed: ${[...ALLOWED_MIME].join(", ")}`,
            trace_id: request.id,
          },
        });
      }

      let buffer: Buffer;
      try {
        buffer = Buffer.from(b64, "base64");
      } catch {
        return reply.code(400).send({
          error: { code: "VALIDATION_KB_005", message: "Invalid base64 payload", trace_id: request.id },
        });
      }

      if (buffer.byteLength === 0) {
        return reply.code(400).send({
          error: { code: "VALIDATION_KB_006", message: "Empty document payload", trace_id: request.id },
        });
      }

      if (buffer.byteLength > KNOWLEDGE_MAX_UPLOAD_BYTES) {
        return reply.code(413).send({
          error: {
            code: "DOCUMENT_TOO_LARGE",
            message: `Document exceeds KNOWLEDGE_MAX_UPLOAD_BYTES (${KNOWLEDGE_MAX_UPLOAD_BYTES})`,
            trace_id: request.id,
          },
        });
      }

      const { assertCanCreateKnowledgeDocument } = await import("@botmate/runtime");
      const { sendCommercialError } = await import("../workspace/commercial-errors.js");
      try {
        await assertCanCreateKnowledgeDocument(prisma, auth.tenantId);
      } catch (err) {
        return sendCommercialError(reply, err, request.id);
      }

      const doc = await prisma.knowledgeDocument.create({
        data: {
          tenantId: auth.tenantId,
          knowledgeBaseId: base.id,
          title,
          mimeType,
          storagePath: "__pending__",
          byteSize: buffer.byteLength,
          status: "pending",
          metadata: {
            uploadedByUserId: auth.userId,
          } satisfies Record<string, unknown>,
        },
        select: { id: true },
      });

      const relPath = `${auth.tenantId}/${doc.id}/blob`;
      const absDir = join(storageRootDir(), auth.tenantId, doc.id);
      await mkdir(absDir, { recursive: true });
      await writeFile(join(absDir, "blob"), buffer);

      await prisma.knowledgeDocument.update({
        where: { id: doc.id },
        data: { storagePath: relPath, status: "pending" },
      });

      await enqueue.knowledgeProcess(
        queues.knowledgeProcess,
        mergePolicyContextSafe(
          mergeExecutionContextSafe({
            tenantId: auth.tenantId,
            documentId: doc.id,
            source: "upload",
          }) as Record<string, unknown>,
        ) as Record<string, unknown>,
      );

      const { MILESTONE_DEDUPE, recordProductEventFireAndForget } = await import("@botmate/runtime");
      recordProductEventFireAndForget({
        prisma,
        tenantId: auth.tenantId,
        userId: auth.userId,
        name: "activation.first_knowledge_uploaded",
        dedupeKey: MILESTONE_DEDUPE.firstKnowledge,
      });

      return reply.code(202).send({
        id: doc.id,
        knowledgeBaseId: base.id,
        status: "pending",
        queued: true,
      });
    },
  );
}
