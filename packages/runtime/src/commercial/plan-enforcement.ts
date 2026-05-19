import type { PrismaClient } from "@botmate/database";
import type { PlanEntitlements, TenantPlanTier } from "@botmate/shared";
import { buildTenantUsageSummary } from "./tenant-usage-summary.js";
import { resolvePlanEntitlements, resolveTenantPlanTier } from "./plan-entitlements.js";

export class PlanLimitError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  readonly planTier: TenantPlanTier;
  readonly upgradeTier: TenantPlanTier | null;
  readonly limitKey: string;

  constructor(input: {
    code: string;
    message: string;
    httpStatus?: number;
    planTier: TenantPlanTier;
    upgradeTier?: TenantPlanTier | null;
    limitKey: string;
  }) {
    super(input.message);
    this.name = "PlanLimitError";
    this.code = input.code;
    this.httpStatus = input.httpStatus ?? 402;
    this.planTier = input.planTier;
    this.upgradeTier = input.upgradeTier ?? null;
    this.limitKey = input.limitKey;
  }
}

export class TenantOperationalError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(code: string, message: string, httpStatus = 403) {
    super(message);
    this.name = "TenantOperationalError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export async function loadTenantCommercialContext(
  prisma: PrismaClient,
  tenantId: string,
): Promise<{
  planTier: TenantPlanTier;
  entitlements: PlanEntitlements;
  suspended: boolean;
  archived: boolean;
}> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { planTier: true, suspendedAt: true, archivedAt: true },
  });
  if (!tenant) {
    throw new TenantOperationalError("NOT_FOUND_001", "Tenant not found", 404);
  }
  const planTier = resolveTenantPlanTier(tenant.planTier);
  return {
    planTier,
    entitlements: resolvePlanEntitlements(planTier),
    suspended: Boolean(tenant.suspendedAt),
    archived: Boolean(tenant.archivedAt),
  };
}

export async function assertTenantOperationalForMutation(
  prisma: PrismaClient,
  tenantId: string,
): Promise<{ planTier: TenantPlanTier; entitlements: PlanEntitlements }> {
  const ctx = await loadTenantCommercialContext(prisma, tenantId);
  if (ctx.archived) {
    throw new TenantOperationalError("TENANT_ARCHIVED", "Workspace archived", 403);
  }
  if (ctx.suspended) {
    throw new TenantOperationalError("TENANT_SUSPENDED", "Workspace suspended", 403);
  }
  return { planTier: ctx.planTier, entitlements: ctx.entitlements };
}

function upgradeTarget(current: TenantPlanTier): TenantPlanTier | null {
  if (current === "starter") return "pro";
  if (current === "pro") return "enterprise";
  return null;
}

export async function assertCanCreateAssistant(prisma: PrismaClient, tenantId: string): Promise<void> {
  const { planTier, entitlements } = await assertTenantOperationalForMutation(prisma, tenantId);
  const usage = await buildTenantUsageSummary(prisma, tenantId);
  if (usage.assistants.atLimit) {
    throw new PlanLimitError({
      code: "PLAN_LIMIT_ASSISTANTS",
      message: `Assistant limit reached (${usage.assistants.limit}) on ${planTier} plan`,
      planTier,
      upgradeTier: upgradeTarget(planTier),
      limitKey: "assistants",
    });
  }
  void entitlements;
}

export async function assertCanCreateKnowledgeDocument(
  prisma: PrismaClient,
  tenantId: string,
): Promise<void> {
  const { planTier } = await assertTenantOperationalForMutation(prisma, tenantId);
  const usage = await buildTenantUsageSummary(prisma, tenantId);
  if (usage.knowledgeDocuments.atLimit) {
    throw new PlanLimitError({
      code: "PLAN_LIMIT_KNOWLEDGE",
      message: `Knowledge document limit reached (${usage.knowledgeDocuments.limit}) on ${planTier} plan`,
      planTier,
      upgradeTier: upgradeTarget(planTier),
      limitKey: "knowledgeDocuments",
    });
  }
}

export async function assertCanAddWorkspaceMember(prisma: PrismaClient, tenantId: string): Promise<void> {
  const { planTier } = await assertTenantOperationalForMutation(prisma, tenantId);
  const usage = await buildTenantUsageSummary(prisma, tenantId);
  const pendingInvites = await prisma.tenantInvite.count({
    where: { tenantId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
  });
  const projected = usage.members.used + pendingInvites;
  if (projected >= usage.members.limit) {
    throw new PlanLimitError({
      code: "PLAN_LIMIT_MEMBERS",
      message: `Member limit reached (${usage.members.limit}) on ${planTier} plan`,
      planTier,
      upgradeTier: upgradeTarget(planTier),
      limitKey: "members",
    });
  }
}

export async function assertCanEnqueueAssistantRun(prisma: PrismaClient, tenantId: string): Promise<void> {
  const { planTier, entitlements } = await assertTenantOperationalForMutation(prisma, tenantId);
  if (!entitlements.runtimeUi) {
    throw new PlanLimitError({
      code: "PLAN_FEATURE_RUNTIME",
      message: "Runtime assistant runs require Pro plan or higher",
      planTier,
      upgradeTier: upgradeTarget(planTier),
      limitKey: "runtimeUi",
      httpStatus: 403,
    });
  }
  const usage = await buildTenantUsageSummary(prisma, tenantId);
  if (usage.executions.atLimit) {
    throw new PlanLimitError({
      code: "PLAN_LIMIT_EXECUTIONS",
      message: `Monthly execution limit reached (${usage.executions.limit})`,
      planTier,
      upgradeTier: upgradeTarget(planTier),
      limitKey: "executions",
    });
  }
}

export async function assertBrowserAutomationAllowed(
  prisma: PrismaClient,
  tenantId: string,
): Promise<void> {
  const { planTier, entitlements } = await assertTenantOperationalForMutation(prisma, tenantId);
  if (!entitlements.browserAutomation) {
    throw new PlanLimitError({
      code: "PLAN_FEATURE_BROWSER",
      message: "Browser automation requires Pro plan or higher",
      planTier,
      upgradeTier: upgradeTarget(planTier),
      limitKey: "browserAutomation",
      httpStatus: 403,
    });
  }
  const usage = await buildTenantUsageSummary(prisma, tenantId);
  if (usage.browserRuns.atLimit) {
    throw new PlanLimitError({
      code: "PLAN_LIMIT_BROWSER_RUNS",
      message: `Monthly browser run limit reached (${usage.browserRuns.limit})`,
      planTier,
      upgradeTier: upgradeTarget(planTier),
      limitKey: "browserRuns",
    });
  }
}

export async function assertRuntimeWorkspaceUiAllowed(
  prisma: PrismaClient,
  tenantId: string,
): Promise<void> {
  const { planTier, entitlements } = await assertTenantOperationalForMutation(prisma, tenantId);
  if (!entitlements.runtimeWorkspaceUi) {
    throw new PlanLimitError({
      code: "PLAN_FEATURE_RUNTIME_WORKSPACE",
      message: "Runtime workspace tools require Enterprise plan",
      planTier,
      upgradeTier: upgradeTarget(planTier),
      limitKey: "runtimeWorkspaceUi",
      httpStatus: 403,
    });
  }
}
