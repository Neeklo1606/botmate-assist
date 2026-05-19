import type { PrismaClient } from "@botmate/database";
import {
  buildTenantActivationSnapshot,
  getTenantWorkspaceState,
  resolvePlanEntitlements,
  resolveTenantPlanTier,
} from "@botmate/runtime";

export async function getWorkspaceOverview(prisma: PrismaClient, tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, planTier: true, suspendedAt: true, archivedAt: true },
  });
  if (!tenant) throw new Error("TENANT_NOT_FOUND");

  const planTier = resolveTenantPlanTier(tenant.planTier);
  const entitlements = resolvePlanEntitlements(planTier);
  const activation = await buildTenantActivationSnapshot(prisma, tenantId);
  const workspaceState = await getTenantWorkspaceState(prisma, tenantId);

  return {
    ok: true as const,
    tenantId: tenant.id,
    tenantName: tenant.name,
    planTier,
    suspended: Boolean(tenant.suspendedAt),
    archived: Boolean(tenant.archivedAt),
    lifecycleStage: workspaceState.lifecycleStage,
    entitlements,
    activation,
    recommendedNextSteps: workspaceState.recommendedActions,
    onboardingCompletedAt: workspaceState.onboardingCompletedAt?.toISOString() ?? null,
    onboardingSteps: workspaceState.onboardingSteps,
  };
}

export async function listWorkspaceMembers(prisma: PrismaClient, tenantId: string) {
  const rows = await prisma.user.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, fullName: true, role: true, createdAt: true },
  });
  return {
    ok: true as const,
    items: rows.map((r) => ({
      id: r.id,
      email: r.email,
      fullName: r.fullName,
      role: r.role,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export function assertTenantOperational(tenant: {
  suspendedAt: Date | null;
  archivedAt: Date | null;
}): void {
  if (tenant.archivedAt) throw new Error("TENANT_ARCHIVED");
  if (tenant.suspendedAt) throw new Error("TENANT_SUSPENDED");
}
