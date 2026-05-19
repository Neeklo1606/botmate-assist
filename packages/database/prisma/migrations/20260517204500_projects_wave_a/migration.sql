-- CreateEnum
CREATE TYPE "ProjectKind" AS ENUM ('assistant', 'media', 'site');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('draft', 'preparing', 'ready', 'paused');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "kind" "ProjectKind" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'preparing',
    "briefData" JSONB NOT NULL,
    "stats" JSONB,
    "readyAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_tenantId_updatedAt_idx" ON "Project"("tenantId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Project_tenantId_archivedAt_idx" ON "Project"("tenantId", "archivedAt");

-- CreateIndex
CREATE INDEX "Project_tenantId_ownerUserId_idx" ON "Project"("tenantId", "ownerUserId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
