-- Phase 9C — persisted governance audit projection (tenant-scoped)

CREATE TABLE "RuntimeGovernanceAuditEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "traceId" TEXT,
    "sessionId" TEXT,
    "assistantId" TEXT,
    "code" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" VARCHAR(2048) NOT NULL,
    "surface" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuntimeGovernanceAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RuntimeGovernanceAuditEvent_tenantId_dedupeKey_key" ON "RuntimeGovernanceAuditEvent"("tenantId", "dedupeKey");

CREATE INDEX "RuntimeGovernanceAuditEvent_tenantId_traceId_idx" ON "RuntimeGovernanceAuditEvent"("tenantId", "traceId");

CREATE INDEX "RuntimeGovernanceAuditEvent_tenantId_sessionId_idx" ON "RuntimeGovernanceAuditEvent"("tenantId", "sessionId");

CREATE INDEX "RuntimeGovernanceAuditEvent_tenantId_createdAt_idx" ON "RuntimeGovernanceAuditEvent"("tenantId", "createdAt" DESC);

CREATE INDEX "RuntimeGovernanceAuditEvent_tenantId_code_idx" ON "RuntimeGovernanceAuditEvent"("tenantId", "code");

ALTER TABLE "RuntimeGovernanceAuditEvent" ADD CONSTRAINT "RuntimeGovernanceAuditEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
