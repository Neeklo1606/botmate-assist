-- CreateEnum
CREATE TYPE "LeadPipelineStatus" AS ENUM ('new', 'working', 'meeting', 'closed', 'rejected');

-- CreateEnum
CREATE TYPE "LeadSourceKind" AS ENUM ('chat', 'call', 'form', 'tool', 'other');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assistantId" TEXT,
    "projectId" TEXT,
    "sessionId" TEXT,
    "ownerUserId" TEXT,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "summary" TEXT NOT NULL DEFAULT '',
    "interest" TEXT NOT NULL DEFAULT '',
    "source" "LeadSourceKind" NOT NULL DEFAULT 'tool',
    "pipelineStatus" "LeadPipelineStatus" NOT NULL DEFAULT 'new',
    "idempotencyKey" TEXT,
    "attribution" JSONB,
    "metadata" JSONB,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_tenantId_pipelineStatus_idx" ON "Lead"("tenantId", "pipelineStatus");

-- CreateIndex
CREATE INDEX "Lead_tenantId_archivedAt_idx" ON "Lead"("tenantId", "archivedAt");

-- CreateIndex
CREATE INDEX "Lead_tenantId_createdAt_idx" ON "Lead"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Lead_tenantId_source_idx" ON "Lead"("tenantId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_tenantId_idempotencyKey_key" ON "Lead"("tenantId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Assistant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
