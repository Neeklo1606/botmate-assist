-- Phase 13A — tenant SaaS operations fields

CREATE TYPE "TenantPlanTier" AS ENUM ('starter', 'pro', 'enterprise');

ALTER TABLE "Tenant" ADD COLUMN "planTier" "TenantPlanTier" NOT NULL DEFAULT 'starter';
ALTER TABLE "Tenant" ADD COLUMN "suspendedAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "archivedAt" TIMESTAMP(3);
