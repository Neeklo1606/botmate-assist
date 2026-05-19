import type { PrismaClient } from "@botmate/database";
import { KNOWLEDGE_VECTOR_DIMENSION, KNOWLEDGE_VECTOR_SEARCH_MAX_TOP_K } from "../knowledge/constants.js";

export interface SimilarChunkHit {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  ordinal: number;
  content: string;
  score: number;
  metadata: unknown;
}

export function formatPgVector(values: number[]): string {
  if (values.length !== KNOWLEDGE_VECTOR_DIMENSION) {
    throw new Error(`VECTOR_LITERAL_DIM_MISMATCH:${values.length}`);
  }
  const nums = values.map((v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error("VECTOR_LITERAL_NON_FINITE");
    return n.toFixed(8);
  });
  return `[${nums.join(",")}]`;
}

export async function searchSimilarKnowledgeChunks(
  prisma: PrismaClient,
  params: {
    tenantId: string;
    knowledgeBaseIds: string[];
    queryEmbedding: number[];
    topK: number;
  },
): Promise<SimilarChunkHit[]> {
  if (params.knowledgeBaseIds.length === 0 || params.topK <= 0) return [];

  const topK = Math.min(
    KNOWLEDGE_VECTOR_SEARCH_MAX_TOP_K,
    Math.max(1, Math.floor(params.topK)),
  );

  const vec = formatPgVector(params.queryEmbedding);

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      chunkId: string;
      documentId: string;
      documentTitle: string;
      ordinal: number;
      content: string;
      score: number;
      metadata: unknown;
    }>
  >(
    `
    SELECT
      c."id" AS "chunkId",
      c."documentId" AS "documentId",
      d."title" AS "documentTitle",
      c."ordinal" AS "ordinal",
      c."content" AS "content",
      (1 - (c.embedding <=> $1::vector))::float AS "score",
      c."metadata" AS "metadata"
    FROM "KnowledgeChunk" c
    INNER JOIN "KnowledgeDocument" d ON d."id" = c."documentId"
    WHERE c."tenantId" = $2
      AND d."tenantId" = $2
      AND d."knowledgeBaseId" = ANY($3::text[])
      AND d."archivedAt" IS NULL
      AND d."status" = 'ready'
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> $1::vector
    LIMIT $4
    `,
    vec,
    params.tenantId,
    params.knowledgeBaseIds,
    topK,
  );

  return rows.map((r) => ({
    chunkId: r.chunkId,
    documentId: r.documentId,
    documentTitle: r.documentTitle,
    ordinal: r.ordinal,
    content: r.content,
    score: typeof r.score === "number" ? r.score : Number(r.score),
    metadata: r.metadata,
  }));
}

export async function updateKnowledgeChunkEmbedding(
  prisma: PrismaClient,
  params: { tenantId: string; chunkId: string; embedding: number[] },
): Promise<void> {
  const vec = formatPgVector(params.embedding);
  await prisma.$executeRawUnsafe(
    `UPDATE "KnowledgeChunk" SET embedding = $1::vector, "embeddedAt" = NOW() WHERE "id" = $2 AND "tenantId" = $3`,
    vec,
    params.chunkId,
    params.tenantId,
  );
}
