-- Phase 9D: Notification correlation columns + ExecutionFact durable projection

ALTER TABLE "Notification" ADD COLUMN "traceId" TEXT,
ADD COLUMN "executionId" TEXT;

CREATE INDEX "Notification_tenantId_traceId_idx" ON "Notification"("tenantId", "traceId");

CREATE INDEX "Notification_tenantId_executionId_idx" ON "Notification"("tenantId", "executionId");

CREATE TABLE "ExecutionFact" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "correlationId" TEXT,
    "assistantId" TEXT,
    "lane" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "policyReasonCode" TEXT,
    "governanceReasonCode" TEXT,
    "replayRelated" BOOLEAN NOT NULL DEFAULT false,
    "sourceTable" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "provisional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionFact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExecutionFact_tenantId_dedupeKey_key" ON "ExecutionFact"("tenantId", "dedupeKey");

CREATE INDEX "ExecutionFact_tenantId_traceId_ts_idx" ON "ExecutionFact"("tenantId", "traceId", "ts");

CREATE INDEX "ExecutionFact_tenantId_executionId_ts_idx" ON "ExecutionFact"("tenantId", "executionId", "ts");

ALTER TABLE "ExecutionFact" ADD CONSTRAINT "ExecutionFact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
