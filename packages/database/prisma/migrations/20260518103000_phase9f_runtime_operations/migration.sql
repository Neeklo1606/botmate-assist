-- Phase 9F — operational runtime coordination (additive projections)

CREATE TABLE "RuntimeActivityFact" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "kind" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "traceId" TEXT,
    "executionId" TEXT,
    "correlationId" TEXT,
    "summary" TEXT NOT NULL,
    "payload" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuntimeActivityFact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RuntimeActivityFact_tenantId_dedupeKey_key" ON "RuntimeActivityFact"("tenantId", "dedupeKey");
CREATE INDEX "RuntimeActivityFact_tenantId_ts_idx" ON "RuntimeActivityFact"("tenantId", "ts" DESC);
CREATE INDEX "RuntimeActivityFact_tenantId_executionId_ts_idx" ON "RuntimeActivityFact"("tenantId", "executionId", "ts" DESC);

ALTER TABLE "RuntimeActivityFact" ADD CONSTRAINT "RuntimeActivityFact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "RuntimeBookmark" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "note" VARCHAR(512),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuntimeBookmark_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RuntimeBookmark_tenantId_userId_executionId_key" ON "RuntimeBookmark"("tenantId", "userId", "executionId");
CREATE INDEX "RuntimeBookmark_tenantId_userId_createdAt_idx" ON "RuntimeBookmark"("tenantId", "userId", "createdAt" DESC);

ALTER TABLE "RuntimeBookmark" ADD CONSTRAINT "RuntimeBookmark_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuntimeBookmark" ADD CONSTRAINT "RuntimeBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "RuntimeExecutionNote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuntimeExecutionNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RuntimeExecutionNote_tenantId_executionId_createdAt_idx" ON "RuntimeExecutionNote"("tenantId", "executionId", "createdAt" DESC);

ALTER TABLE "RuntimeExecutionNote" ADD CONSTRAINT "RuntimeExecutionNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuntimeExecutionNote" ADD CONSTRAINT "RuntimeExecutionNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "RuntimeIncidentAck" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "incidentKey" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mutedUntil" TIMESTAMP(3),
    "assigneeLabel" VARCHAR(160),

    CONSTRAINT "RuntimeIncidentAck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RuntimeIncidentAck_tenantId_userId_incidentKey_key" ON "RuntimeIncidentAck"("tenantId", "userId", "incidentKey");

ALTER TABLE "RuntimeIncidentAck" ADD CONSTRAINT "RuntimeIncidentAck_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuntimeIncidentAck" ADD CONSTRAINT "RuntimeIncidentAck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ExecutionOperationalMark" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "frozen" BOOLEAN NOT NULL DEFAULT false,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "replayBlocked" BOOLEAN NOT NULL DEFAULT false,
    "governanceQuarantine" BOOLEAN NOT NULL DEFAULT false,
    "updatedByUserId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutionOperationalMark_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExecutionOperationalMark_tenantId_executionId_key" ON "ExecutionOperationalMark"("tenantId", "executionId");

ALTER TABLE "ExecutionOperationalMark" ADD CONSTRAINT "ExecutionOperationalMark_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionOperationalMark" ADD CONSTRAINT "ExecutionOperationalMark_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
