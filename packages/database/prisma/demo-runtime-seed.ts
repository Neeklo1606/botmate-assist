/**
 * Sales / staging demo data for tenant runtime (Phase 12B).
 * Idempotent — safe to re-run. Requires an existing workspace user.
 *
 * Usage:
 *   ENABLE_DEMO_SEED=true DEMO_SEED_EMAIL=admin@example.com pnpm --filter @botmate/database seed
 */
import type { PrismaClient } from "@prisma/client";

export const DEMO_TRACE_IDS = {
  success: "demo-exec-success-12b",
  failed: "demo-exec-failed-12b",
  frozen: "demo-exec-frozen-12b",
} as const;

export async function runDemoRuntimeSeed(prisma: PrismaClient): Promise<void> {
  const email = (process.env.DEMO_SEED_EMAIL || process.env.DEV_SEED_EMAIL)?.trim().toLowerCase();
  if (!email) {
    throw new Error("[demo-seed] DEMO_SEED_EMAIL or DEV_SEED_EMAIL is required");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`[demo-seed] User not found: ${email}`);
  }

  const tenantId = user.tenantId;
  const userId = user.id;

  let assistant = await prisma.assistant.findFirst({
    where: { tenantId, name: "Sales Demo Assistant" },
  });
  if (!assistant) {
    assistant = await prisma.assistant.create({
      data: {
        tenantId,
        ownerUserId: userId,
        name: "Sales Demo Assistant",
        niche: "services",
        status: "active",
      },
    });
  }

  let session = await prisma.chatSession.findFirst({
    where: { tenantId, assistantId: assistant.id, title: "Demo sales conversation" },
  });
  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        tenantId,
        userId,
        assistantId: assistant.id,
        title: "Demo sales conversation",
        status: "ACTIVE",
      },
    });
  }

  const now = Date.now();
  const usages: Array<{
    traceId: string;
    durationMs: number;
    metadata: Record<string, unknown>;
  }> = [
    {
      traceId: DEMO_TRACE_IDS.success,
      durationMs: 4200,
      metadata: { source: "demo_seed", outcome: "ok" },
    },
    {
      traceId: DEMO_TRACE_IDS.failed,
      durationMs: 2100,
      metadata: {
        source: "demo_seed",
        fatalError: "Demo policy denial for sales walkthrough",
      },
    },
    {
      traceId: DEMO_TRACE_IDS.frozen,
      durationMs: 8900,
      metadata: { source: "demo_seed", outcome: "ok" },
    },
  ];

  for (let i = 0; i < usages.length; i++) {
    const u = usages[i]!;
    const existing = await prisma.aiExecutionUsage.findFirst({
      where: { tenantId, traceId: u.traceId },
    });
    if (existing) continue;

    await prisma.aiExecutionUsage.create({
      data: {
        tenantId,
        assistantId: assistant.id,
        sessionId: session.id,
        traceId: u.traceId,
        sink: "worker_assistant_run",
        provider: "openai",
        modelId: "gpt-4o-mini",
        promptTokens: 120,
        completionTokens: 80,
        totalTokens: 200,
        durationMs: u.durationMs,
        metadata: u.metadata,
        createdAt: new Date(now - (i + 1) * 3_600_000),
      },
    });
  }

  await prisma.executionOperationalMark.upsert({
    where: {
      tenantId_executionId: { tenantId, executionId: DEMO_TRACE_IDS.frozen },
    },
    create: {
      tenantId,
      executionId: DEMO_TRACE_IDS.frozen,
      frozen: true,
      updatedByUserId: userId,
    },
    update: { frozen: true, updatedByUserId: userId },
  });

  await prisma.runtimeActivityFact.upsert({
    where: {
      tenantId_dedupeKey: { tenantId, dedupeKey: "demo-seed:activity:success" },
    },
    create: {
      tenantId,
      dedupeKey: "demo-seed:activity:success",
      ts: new Date(now - 3_600_000),
      kind: "execution.completed",
      severity: "info",
      traceId: DEMO_TRACE_IDS.success,
      executionId: DEMO_TRACE_IDS.success,
      summary: "Demo execution completed (seeded for sales)",
      payload: { source: "demo_seed" },
    },
    update: {},
  });

  console.log(`[demo-seed] Tenant ${tenantId} — assistant "${assistant.name}"`);
  console.log(`[demo-seed] Open /runtime and select executions:`);
  for (const id of Object.values(DEMO_TRACE_IDS)) {
    console.log(`  - ${id}`);
  }
}
