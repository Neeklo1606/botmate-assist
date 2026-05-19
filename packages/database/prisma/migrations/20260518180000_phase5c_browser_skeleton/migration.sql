-- Phase 5C browser runtime skeleton

CREATE TYPE "BrowserSessionStatus" AS ENUM ('creating', 'running', 'idle_soft', 'terminating', 'terminated');

CREATE TYPE "BrowserRunStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'cancelled');

CREATE TYPE "BrowserArtifactKind" AS ENUM ('screenshot', 'trace', 'html_snapshot', 'extract', 'browser_storage');

CREATE TABLE "BrowserSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assistantId" TEXT,
    "chatSessionId" TEXT,
    "createdByUserId" TEXT,
    "status" "BrowserSessionStatus" NOT NULL DEFAULT 'creating',
    "policySnapshot" JSONB,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "heartbeatAt" TIMESTAMP(3),
    "idleExpiresAt" TIMESTAMP(3),
    "lastUrl" TEXT,
    "storageArtifactId" TEXT,
    "pendingCleanupAt" TIMESTAMP(3),
    "terminatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrowserSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BrowserRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "browserSessionId" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "status" "BrowserRunStatus" NOT NULL DEFAULT 'queued',
    "stepPlan" JSONB NOT NULL,
    "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
    "toolInvocationId" TEXT,
    "error" JSONB,
    "queuedReason" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "output" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrowserRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BrowserArtifact" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "browserSessionId" TEXT NOT NULL,
    "browserRunId" TEXT,
    "kind" "BrowserArtifactKind" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "byteLength" BIGINT NOT NULL DEFAULT 0,
    "sha256" TEXT,
    "contentType" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrowserArtifact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BrowserEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "browserSessionId" TEXT NOT NULL,
    "browserRunId" TEXT,
    "seq" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrowserEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BrowserEvent_browserSessionId_seq_key" ON "BrowserEvent"("browserSessionId", "seq");

CREATE INDEX "BrowserSession_tenantId_status_idx" ON "BrowserSession"("tenantId", "status");

CREATE INDEX "BrowserSession_tenantId_createdAt_idx" ON "BrowserSession"("tenantId", "createdAt" DESC);

CREATE INDEX "BrowserSession_tenantId_leaseExpiresAt_idx" ON "BrowserSession"("tenantId", "leaseExpiresAt");

CREATE INDEX "BrowserSession_tenantId_idleExpiresAt_idx" ON "BrowserSession"("tenantId", "idleExpiresAt");

CREATE INDEX "BrowserSession_tenantId_pendingCleanupAt_idx" ON "BrowserSession"("tenantId", "pendingCleanupAt");

CREATE INDEX "BrowserRun_tenantId_browserSessionId_idx" ON "BrowserRun"("tenantId", "browserSessionId");

CREATE INDEX "BrowserRun_tenantId_status_idx" ON "BrowserRun"("tenantId", "status");

CREATE INDEX "BrowserRun_tenantId_createdAt_idx" ON "BrowserRun"("tenantId", "createdAt" DESC);

CREATE INDEX "BrowserRun_traceId_idx" ON "BrowserRun"("traceId");

CREATE INDEX "BrowserArtifact_tenantId_browserSessionId_idx" ON "BrowserArtifact"("tenantId", "browserSessionId");

CREATE INDEX "BrowserArtifact_tenantId_expiresAt_idx" ON "BrowserArtifact"("tenantId", "expiresAt");

CREATE INDEX "BrowserArtifact_tenantId_createdAt_idx" ON "BrowserArtifact"("tenantId", "createdAt" DESC);

CREATE INDEX "BrowserEvent_tenantId_browserSessionId_idx" ON "BrowserEvent"("tenantId", "browserSessionId");

CREATE INDEX "BrowserEvent_tenantId_browserRunId_idx" ON "BrowserEvent"("tenantId", "browserRunId");

CREATE INDEX "BrowserEvent_tenantId_createdAt_idx" ON "BrowserEvent"("tenantId", "createdAt" DESC);

ALTER TABLE "BrowserSession" ADD CONSTRAINT "BrowserSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BrowserSession" ADD CONSTRAINT "BrowserSession_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BrowserSession" ADD CONSTRAINT "BrowserSession_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BrowserRun" ADD CONSTRAINT "BrowserRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BrowserRun" ADD CONSTRAINT "BrowserRun_browserSessionId_fkey" FOREIGN KEY ("browserSessionId") REFERENCES "BrowserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BrowserArtifact" ADD CONSTRAINT "BrowserArtifact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BrowserArtifact" ADD CONSTRAINT "BrowserArtifact_browserSessionId_fkey" FOREIGN KEY ("browserSessionId") REFERENCES "BrowserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BrowserArtifact" ADD CONSTRAINT "BrowserArtifact_browserRunId_fkey" FOREIGN KEY ("browserRunId") REFERENCES "BrowserRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BrowserEvent" ADD CONSTRAINT "BrowserEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BrowserEvent" ADD CONSTRAINT "BrowserEvent_browserSessionId_fkey" FOREIGN KEY ("browserSessionId") REFERENCES "BrowserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BrowserEvent" ADD CONSTRAINT "BrowserEvent_browserRunId_fkey" FOREIGN KEY ("browserRunId") REFERENCES "BrowserRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
