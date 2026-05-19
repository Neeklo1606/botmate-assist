-- Phase 4A: AI execution usage accounting (tenant-isolated ledger).

CREATE TABLE "AiExecutionUsage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assistantId" TEXT,
    "sessionId" TEXT,
    "traceId" TEXT NOT NULL,
    "jobId" TEXT,
    "sink" TEXT NOT NULL DEFAULT 'worker_assistant_run',
    "provider" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "durationMs" INTEGER NOT NULL,
    "queueWaitMs" INTEGER,
    "estimatedCostUsd" DECIMAL(14,8),
    "streamChunkCount" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiExecutionUsage_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AiExecutionUsage" ADD CONSTRAINT "AiExecutionUsage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "AiExecutionUsage_tenantId_createdAt_idx" ON "AiExecutionUsage"("tenantId", "createdAt" DESC);

CREATE INDEX "AiExecutionUsage_assistantId_idx" ON "AiExecutionUsage"("assistantId");

CREATE INDEX "AiExecutionUsage_sessionId_idx" ON "AiExecutionUsage"("sessionId");

CREATE INDEX "AiExecutionUsage_traceId_idx" ON "AiExecutionUsage"("traceId");
