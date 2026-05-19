-- Phase 13B: invites, workspace state, VIEWER role
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'VIEWER';

CREATE TYPE "CustomerLifecycleStage" AS ENUM (
  'invited',
  'onboarded',
  'activated',
  'retained',
  'advanced_runtime',
  'enterprise_candidate',
  'churn_risk'
);

CREATE TABLE "TenantWorkspaceState" (
  "tenantId" TEXT NOT NULL,
  "lifecycleStage" "CustomerLifecycleStage" NOT NULL DEFAULT 'invited',
  "onboardingCompletedAt" TIMESTAMP(3),
  "onboardingSteps" JSONB NOT NULL DEFAULT '{}',
  "recommendedActions" JSONB NOT NULL DEFAULT '[]',
  "churnRiskAt" TIMESTAMP(3),
  "lifecycleSyncedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantWorkspaceState_pkey" PRIMARY KEY ("tenantId")
);

CREATE TABLE "TenantInvite" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'OPERATOR',
  "tokenHash" TEXT NOT NULL,
  "invitedByUserId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenantInvite_tokenHash_key" ON "TenantInvite"("tokenHash");
CREATE UNIQUE INDEX "TenantInvite_tenantId_email_key" ON "TenantInvite"("tenantId", "email");
CREATE INDEX "TenantInvite_tenantId_createdAt_idx" ON "TenantInvite"("tenantId", "createdAt" DESC);

ALTER TABLE "TenantWorkspaceState"
  ADD CONSTRAINT "TenantWorkspaceState_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenantInvite"
  ADD CONSTRAINT "TenantInvite_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenantInvite"
  ADD CONSTRAINT "TenantInvite_invitedByUserId_fkey"
  FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
