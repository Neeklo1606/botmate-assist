-- CreateEnum
CREATE TYPE "AssistantNiche" AS ENUM ('real_estate', 'auto', 'clinic', 'services', 'online_school', 'agency', 'other');

-- CreateEnum
CREATE TYPE "AssistantStatus" AS ENUM ('draft', 'active', 'paused');

-- CreateTable
CREATE TABLE "Assistant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "niche" "AssistantNiche" NOT NULL,
    "status" "AssistantStatus" NOT NULL DEFAULT 'draft',
    "settings" JSONB,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assistant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assistant_tenantId_updatedAt_idx" ON "Assistant"("tenantId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Assistant_tenantId_status_idx" ON "Assistant"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Assistant" ADD CONSTRAINT "Assistant_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
