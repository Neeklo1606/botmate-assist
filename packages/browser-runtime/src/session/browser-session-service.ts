import type { Prisma, PrismaClient } from "@botmate/database";

export async function ensureBrowserSessionForChat(input: {
  prisma: PrismaClient;
  tenantId: string;
  chatSessionId: string;
  assistantId?: string | null;
  userId?: string | null;
  policySnapshot: Prisma.InputJsonValue;
}) {
  const existing = await input.prisma.browserSession.findFirst({
    where: {
      tenantId: input.tenantId,
      chatSessionId: input.chatSessionId,
      status: { not: "terminated" },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  return input.prisma.browserSession.create({
    data: {
      tenantId: input.tenantId,
      chatSessionId: input.chatSessionId,
      assistantId: input.assistantId ?? undefined,
      createdByUserId: input.userId ?? undefined,
      status: "creating",
      policySnapshot: input.policySnapshot,
    },
  });
}

export async function createQueuedBrowserRun(input: {
  prisma: PrismaClient;
  tenantId: string;
  browserSessionId: string;
  traceId: string;
  stepPlan: Prisma.InputJsonValue;
}) {
  return input.prisma.browserRun.create({
    data: {
      tenantId: input.tenantId,
      browserSessionId: input.browserSessionId,
      traceId: input.traceId,
      status: "queued",
      stepPlan: input.stepPlan,
    },
  });
}

export async function waitForBrowserRunTerminal(input: {
  prisma: PrismaClient;
  tenantId: string;
  browserRunId: string;
  deadlineMs: number;
  pollMs?: number;
}): Promise<{ status: string; output: unknown | null; error: unknown | null }> {
  const poll = input.pollMs ?? 280;
  const deadline = Date.now() + input.deadlineMs;
  while (Date.now() < deadline) {
    const row = await input.prisma.browserRun.findFirst({
      where: { id: input.browserRunId, tenantId: input.tenantId },
      select: { status: true, output: true, error: true },
    });
    if (!row) {
      return { status: "missing", output: null, error: { code: "browser_run_missing" } };
    }
    if (row.status === "succeeded") {
      return { status: row.status, output: row.output ?? null, error: null };
    }
    if (row.status === "failed" || row.status === "cancelled") {
      return { status: row.status, output: row.output ?? null, error: row.error ?? null };
    }
    await new Promise((r) => setTimeout(r, poll));
  }
  return { status: "timeout", output: null, error: { code: "browser_tool_sync_timeout" } };
}

/** Poll BrowserEvent rows for SSE multiplex during sync wait (Phase 5C). */
export async function drainBrowserEventsSince(input: {
  prisma: PrismaClient;
  tenantId: string;
  browserSessionId: string;
  afterSeq: bigint;
}): Promise<Array<{ seq: bigint; type: string; payload: unknown | null }>> {
  return input.prisma.browserEvent.findMany({
    where: {
      tenantId: input.tenantId,
      browserSessionId: input.browserSessionId,
      seq: { gt: input.afterSeq },
    },
    orderBy: { seq: "asc" },
    select: { seq: true, type: true, payload: true },
  });
}
