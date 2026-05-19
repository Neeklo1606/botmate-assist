import type { PrismaClient } from "@botmate/database";
import type { EmbeddingsGeneratePayload } from "@botmate/jobs";
import { EmbeddingsGeneratePayloadSchema, JOB_NAMES } from "@botmate/jobs";
import { decryptIntegrationPayload, getEncryptionMasterKeyFromEnv } from "../crypto-env.js";
import { embedTextsForKnowledge } from "../embeddings/knowledge-embeddings.js";
import type { RuntimeLogger } from "../tracing.js";
import { observeEmbeddingJobBatch } from "../runtime-metrics.js";
import { updateKnowledgeChunkEmbedding } from "../vector/knowledge-vector-repository.js";
import { enforceQueueWorkerIngress } from "../policy/index.js";

async function decryptOpenAiForUser(prisma: PrismaClient, userId: string): Promise<string | null> {
  const row = await prisma.integrationAccount.findFirst({
    where: { userId, provider: "OPENAI", isActive: true },
  });
  if (!row) return null;
  const mk = getEncryptionMasterKeyFromEnv();
  return decryptIntegrationPayload(row.apiKeyEncrypted, mk);
}

export async function executeEmbeddingsGenerateJob(input: {
  prisma: PrismaClient;
  logger: RuntimeLogger;
  job: { id?: string; data: unknown };
}): Promise<void> {
  const payload = EmbeddingsGeneratePayloadSchema.parse(input.job.data) as EmbeddingsGeneratePayload;

  enforceQueueWorkerIngress({
    jobName: JOB_NAMES.EMBEDDINGS_GENERATE,
    tenantId: payload.tenantId,
    policyContext: payload.policyContext,
    executionId: input.job.id ? `job:${input.job.id}` : payload.resourceId,
    logger: input.logger,
    asyncSurfaceTelemetry: true,
    dequeuePayloadRecord: { ...payload },
  });

  const doc = await input.prisma.knowledgeDocument.findFirst({
    where: { id: payload.resourceId, tenantId: payload.tenantId, archivedAt: null },
  });
  if (!doc) {
    throw new Error("KNOWLEDGE_DOCUMENT_NOT_FOUND");
  }

  const meta =
    doc.metadata && typeof doc.metadata === "object" && !Array.isArray(doc.metadata)
      ? (doc.metadata as Record<string, unknown>)
      : {};
  const uploadedByRaw = meta.uploadedByUserId;
  const uploadedByUserId = typeof uploadedByRaw === "string" ? uploadedByRaw.trim() : "";

  const openAiFromIntegration = uploadedByUserId ? await decryptOpenAiForUser(input.prisma, uploadedByUserId) : null;

  const clients = {
    openAiApiKey: openAiFromIntegration ?? process.env.OPENAI_API_KEY?.trim() ?? null,
    openRouterApiKey: process.env.OPENROUTER_API_KEY?.trim() ?? null,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL?.trim() ?? null,
  };

  input.logger.info(
    {
      jobId: input.job.id ?? null,
      tenantId: payload.tenantId,
      documentId: doc.id,
      uploadedByUserId: uploadedByUserId || null,
    },
    "embeddings_generate_begin",
  );

  const chunks = await input.prisma.knowledgeChunk.findMany({
    where: { tenantId: payload.tenantId, documentId: doc.id, embeddedAt: null },
    orderBy: { ordinal: "asc" },
    select: { id: true, content: true },
  });

  const batchSize = Number(process.env.KNOWLEDGE_EMBEDDING_BATCH ?? "16");
  let embedded = 0;

  const jobStarted = Date.now();

  for (let i = 0; i < chunks.length; i += batchSize) {
    const slice = chunks.slice(i, i + batchSize);
    const texts = slice.map((c) => c.content);

    try {
      const res = await embedTextsForKnowledge(texts, clients, { modelHint: payload.modelHint });
      observeEmbeddingJobBatch(res.durationMs, texts.length);

      if (res.embeddings.length !== slice.length) {
        throw new Error("EMBEDDING_BATCH_LENGTH_MISMATCH");
      }

      for (let j = 0; j < slice.length; j++) {
        await updateKnowledgeChunkEmbedding(input.prisma, {
          tenantId: payload.tenantId,
          chunkId: slice[j].id,
          embedding: res.embeddings[j]!,
        });
        embedded += 1;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      input.logger.error(
        {
          jobId: input.job.id ?? null,
          tenantId: payload.tenantId,
          documentId: doc.id,
          batchStartIndex: i,
          err: msg,
        },
        "embeddings_generate_batch_failed",
      );
      throw err;
    }
  }

  input.logger.info(
    {
      jobId: input.job.id ?? null,
      tenantId: payload.tenantId,
      documentId: doc.id,
      embeddedChunks: embedded,
      pendingChunks: chunks.length,
      durationMs: Date.now() - jobStarted,
    },
    "embeddings_generate_complete",
  );
}
