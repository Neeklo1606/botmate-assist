-- Phase 4B — Knowledge domain + pgvector embeddings column.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE "KnowledgeDocStatus" AS ENUM ('pending', 'processing', 'ready', 'failed');

CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assistantId" TEXT,
    "name" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "knowledgeBaseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "status" "KnowledgeDocStatus" NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "metadata" JSONB,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tokenEstimate" INTEGER,
    "metadata" JSONB,
    "embedding" vector(1536),
    "embeddedAt" TIMESTAMP(3),

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_knowledgeBaseId_fkey" FOREIGN KEY ("knowledgeBaseId") REFERENCES "KnowledgeBase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "KnowledgeBase_tenantId_assistantId_idx" ON "KnowledgeBase"("tenantId", "assistantId");

CREATE INDEX "KnowledgeBase_tenantId_archivedAt_idx" ON "KnowledgeBase"("tenantId", "archivedAt");

CREATE INDEX "KnowledgeDocument_tenantId_knowledgeBaseId_idx" ON "KnowledgeDocument"("tenantId", "knowledgeBaseId");

CREATE INDEX "KnowledgeDocument_tenantId_status_idx" ON "KnowledgeDocument"("tenantId", "status");

CREATE INDEX "KnowledgeChunk_tenantId_documentId_idx" ON "KnowledgeChunk"("tenantId", "documentId");
