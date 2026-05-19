import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { PrismaClient } from "@botmate/database";
import type { KnowledgeProcessPayload } from "@botmate/jobs";
import { JOB_NAMES, KnowledgeProcessPayloadSchema } from "@botmate/jobs";
import type { ExecutionLineageAttachment, PolicyJobContext } from "@botmate/shared";
import type { RuntimeLogger } from "../tracing.js";
import { KNOWLEDGE_MAX_CHUNKS_PER_DOCUMENT } from "./constants.js";
import { chunkKnowledgeText } from "./chunk-text.js";
import { extractPlainText } from "./text-extract.js";
import { enforceQueueWorkerIngress } from "../policy/index.js";

function assertSafeStoragePath(rel: string): void {
  if (!rel || rel.includes("..") || rel.startsWith("/") || rel.includes("\\")) {
    throw new Error("INVALID_STORAGE_PATH");
  }
}

export async function executeKnowledgeProcessJob(input: {
  prisma: PrismaClient;
  logger: RuntimeLogger;
  job: { id?: string; data: unknown };
  storageRoot: string;
  enqueueEmbeddingsGenerate: (payload: {
    tenantId: string;
    resourceId: string;
    modelHint?: string;
    policyContext?: PolicyJobContext | null;
    executionLineage?: ExecutionLineageAttachment | null;
  }) => Promise<void>;
}): Promise<void> {
  const payload = KnowledgeProcessPayloadSchema.parse(input.job.data) as KnowledgeProcessPayload;
  enforceQueueWorkerIngress({
    jobName: JOB_NAMES.KNOWLEDGE_PROCESS,
    tenantId: payload.tenantId,
    policyContext: payload.policyContext,
    executionId: input.job.id ? `job:${input.job.id}` : undefined,
    logger: input.logger,
    asyncSurfaceTelemetry: true,
    dequeuePayloadRecord: { ...payload },
  });
  const doc = await input.prisma.knowledgeDocument.findFirst({
    where: { id: payload.documentId, tenantId: payload.tenantId, archivedAt: null },
  });
  if (!doc) {
    throw new Error("KNOWLEDGE_DOCUMENT_NOT_FOUND");
  }

  input.logger.info(
    {
      jobId: input.job.id ?? null,
      tenantId: payload.tenantId,
      documentId: doc.id,
      mimeType: doc.mimeType,
    },
    "knowledge_process_begin",
  );

  await input.prisma.knowledgeDocument.update({
    where: { id: doc.id },
    data: { status: "processing", errorMessage: null },
  });

  try {
    assertSafeStoragePath(doc.storagePath);
    const abs = join(input.storageRoot, doc.storagePath);
    const buf = await readFile(abs);
    const text = await extractPlainText(buf, doc.mimeType);
    let drafts = chunkKnowledgeText(text, doc.mimeType);
    let truncatedNote: Record<string, unknown> | null = null;
    if (drafts.length > KNOWLEDGE_MAX_CHUNKS_PER_DOCUMENT) {
      truncatedNote = {
        truncatedChunks: true,
        originalChunkCount: drafts.length,
        keptChunkCount: KNOWLEDGE_MAX_CHUNKS_PER_DOCUMENT,
      };
      drafts = drafts.slice(0, KNOWLEDGE_MAX_CHUNKS_PER_DOCUMENT);
    }

    await input.prisma.$transaction(async (tx) => {
      await tx.knowledgeChunk.deleteMany({ where: { tenantId: payload.tenantId, documentId: doc.id } });

      const rows = drafts.map((d) => ({
        tenantId: payload.tenantId,
        documentId: doc.id,
        ordinal: d.ordinal,
        content: d.content,
        tokenEstimate: d.tokenEstimate,
        metadata: {
          ...(d.metadata as Record<string, unknown>),
          ingestion: {
            source: payload.source ?? "upload",
            jobId: input.job.id ?? null,
          },
        } as object,
      }));

      const batch = 80;
      for (let i = 0; i < rows.length; i += batch) {
        await tx.knowledgeChunk.createMany({ data: rows.slice(i, i + batch) });
      }

      const priorMeta =
        doc.metadata && typeof doc.metadata === "object" && !Array.isArray(doc.metadata)
          ? (doc.metadata as Record<string, unknown>)
          : {};
      const priorIngest =
        priorMeta.ingestion && typeof priorMeta.ingestion === "object" && !Array.isArray(priorMeta.ingestion)
          ? (priorMeta.ingestion as Record<string, unknown>)
          : {};
      const nextMeta = {
        ...priorMeta,
        ingestion: {
          ...priorIngest,
          source: payload.source ?? "upload",
          lastJobId: input.job.id ?? null,
          chunkCount: drafts.length,
          ...(truncatedNote ?? {}),
        },
      };

      await tx.knowledgeDocument.update({
        where: { id: doc.id },
        data: {
          status: "ready",
          errorMessage: null,
          metadata: nextMeta as object,
        },
      });
    });

    await input.enqueueEmbeddingsGenerate({
      tenantId: payload.tenantId,
      resourceId: doc.id,
      policyContext: payload.policyContext ?? null,
      executionLineage: payload.executionLineage ?? null,
    });

    input.logger.info(
      {
        jobId: input.job.id ?? null,
        tenantId: payload.tenantId,
        documentId: doc.id,
        chunkCount: drafts.length,
      },
      "knowledge_process_complete",
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await input.prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: {
        status: "failed",
        errorMessage: msg.slice(0, 4000),
      },
    });
    input.logger.error(
      {
        jobId: input.job.id ?? null,
        tenantId: payload.tenantId,
        documentId: doc.id,
        err: msg,
      },
      "knowledge_process_failed",
    );
    throw err;
  }
}
