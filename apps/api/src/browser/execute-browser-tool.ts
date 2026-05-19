import { enqueue } from "@botmate/jobs";
import type { ToolExecutionContext, ToolNormalizedResult } from "@botmate/runtime";
import {
  evaluateUnifiedRuntimePolicy,
  mergeExecutionContextSafe,
  mergeHttpAllowHosts,
  mergePolicyContextSafe,
  streamEventToSseLines,
  type StreamEvent,
} from "@botmate/runtime";
import {
  assertTenantDailyRunBudget,
  browserStepsFromToolCall,
  browserSyncWaitMs,
  createQueuedBrowserRun,
  drainBrowserEventsSince,
  ensureBrowserSessionForChat,
  isBrowserRuntimeEnabled,
  StepPlanSchema,
  type BrowserToolId,
} from "@botmate/browser-runtime";
import { prisma, Prisma } from "@botmate/database";
import { getBrowserJobQueues } from "./browser-job-gateway.js";

function mapBrowserRowToStream(browserSessionId: string, row: { type: string; payload: unknown }): StreamEvent | null {
  const payload =
    row.payload && typeof row.payload === "object" && row.payload !== null ? (row.payload as Record<string, unknown>) : {};
  const runId = typeof payload.runId === "string" ? payload.runId : "";
  const stepIndex = typeof payload.stepIndex === "number" ? payload.stepIndex : 0;
  const kind = typeof payload.kind === "string" ? payload.kind : "";

  if (row.type === "browser_step_started") {
    return {
      type: "browser_step_started",
      browserSessionId,
      browserRunId: runId,
      stepIndex,
      kind,
    };
  }
  if (row.type === "browser_step_completed") {
    return {
      type: "browser_step_completed",
      browserSessionId,
      browserRunId: runId,
      stepIndex,
      kind,
    };
  }
  if (row.type === "browser_snapshot") {
    const artifactId = typeof payload.artifactId === "string" ? payload.artifactId : "";
    return {
      type: "browser_snapshot",
      browserSessionId,
      browserRunId: runId,
      artifactId,
      kind,
    };
  }
  if (row.type === "browser_error") {
    const message = typeof payload.message === "string" ? payload.message : "browser_error";
    return {
      type: "browser_error",
      browserSessionId,
      browserRunId: runId,
      code: "browser_execution_failed",
      message,
    };
  }
  return null;
}

export async function executeQueuedBrowserTool(input: {
  toolId: BrowserToolId;
  ctx: ToolExecutionContext;
  args: unknown;
  emitBrowserStream?: (sseChunk: string) => void;
  browserAllowedHosts: readonly string[];
  browserMaxStepsPerRun: number;
  browserMaxArtifactsPerRun: number;
}): Promise<ToolNormalizedResult> {
  if (!isBrowserRuntimeEnabled()) {
    return { ok: false, error: { code: "BROWSER_DISABLED", message: "Browser runtime disabled (feature flag)" } };
  }

  const browserCpGate = evaluateUnifiedRuntimePolicy({
    tenantId: input.ctx.tenantId,
    subsystem: "browser",
  });
  if (!browserCpGate.ok) {
    return {
      ok: false,
      error: { code: browserCpGate.code, message: browserCpGate.message },
    };
  }

  const queues = getBrowserJobQueues();
  if (!queues) {
    return { ok: false, error: { code: "BROWSER_QUEUE_UNAVAILABLE", message: "Redis/BullMQ not configured" } };
  }

  await assertTenantDailyRunBudget(prisma, input.ctx.tenantId);

  const hosts = mergeHttpAllowHosts(process.env.BROWSER_NAVIGATION_ALLOWLIST, [...input.browserAllowedHosts]);

  let rawSteps;
  try {
    rawSteps = browserStepsFromToolCall(input.toolId, input.args);
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "BROWSER_ARGS_INVALID",
        message: err instanceof Error ? err.message.slice(0, 512) : String(err),
      },
    };
  }

  let steps;
  try {
    steps = StepPlanSchema.parse(rawSteps);
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "BROWSER_PLAN_INVALID",
        message: err instanceof Error ? err.message.slice(0, 512) : String(err),
      },
    };
  }

  if (steps.length > input.browserMaxStepsPerRun) {
    return { ok: false, error: { code: "BROWSER_PLAN_TOO_LARGE", message: "Step plan exceeds assistant limit" } };
  }

  void input.browserMaxArtifactsPerRun;

  const policySnapshot = {
    allowedHosts: [...hosts],
    maxArtifactsPerRun: input.browserMaxArtifactsPerRun,
    version: 1,
  } satisfies Record<string, unknown>;

  const { assertBrowserAutomationAllowed } = await import("@botmate/runtime");
  await assertBrowserAutomationAllowed(prisma, input.ctx.tenantId);

  const session = await ensureBrowserSessionForChat({
    prisma,
    tenantId: input.ctx.tenantId,
    chatSessionId: input.ctx.sessionId,
    assistantId: input.ctx.sessionAssistantId ?? input.ctx.operatorAssistantId ?? input.ctx.assistantId,
    userId: input.ctx.userId ?? null,
    policySnapshot: policySnapshot as Prisma.InputJsonValue,
  });

  const run = await createQueuedBrowserRun({
    prisma,
    tenantId: input.ctx.tenantId,
    browserSessionId: session.id,
    traceId: input.ctx.traceId,
    stepPlan: steps as unknown as Prisma.InputJsonValue,
  });

  const redisRoom = `tenant:${input.ctx.tenantId}:chat:${input.ctx.sessionId}`;

  await enqueue.browserRun(
    queues.browserRun,
    mergePolicyContextSafe(
      mergeExecutionContextSafe({
        tenantId: input.ctx.tenantId,
        browserRunId: run.id,
        browserSessionId: session.id,
        traceId: input.ctx.traceId,
        redisRoom,
        correlationId: input.ctx.traceId,
      }) as Record<string, unknown>,
    ) as Record<string, unknown>,
  );

  const deadlineMs = browserSyncWaitMs();
  const deadlineAt = Date.now() + deadlineMs;
  let lastSeq = 0n;

  const drainOnce = async () => {
    if (!input.emitBrowserStream) return;
    const rows = await drainBrowserEventsSince({
      prisma,
      tenantId: input.ctx.tenantId,
      browserSessionId: session.id,
      afterSeq: lastSeq,
    });
    for (const row of rows) {
      lastSeq = row.seq;
      const ev = mapBrowserRowToStream(session.id, { type: row.type, payload: row.payload });
      if (ev) input.emitBrowserStream(streamEventToSseLines(ev));
    }
  };

  let terminal:
    | { status: "succeeded"; output: unknown | null }
    | { status: "failed"; error: unknown | null }
    | { status: "cancelled" }
    | null = null;

  while (Date.now() < deadlineAt) {
    await drainOnce();
    const row = await prisma.browserRun.findFirst({
      where: { id: run.id, tenantId: input.ctx.tenantId },
      select: { status: true, output: true, error: true },
    });
    if (!row) {
      terminal = { status: "failed", error: { message: "browser_run_missing" } };
      break;
    }
    if (row.status === "succeeded") {
      terminal = { status: "succeeded", output: row.output ?? null };
      break;
    }
    if (row.status === "failed") {
      terminal = { status: "failed", error: row.error ?? null };
      break;
    }
    if (row.status === "cancelled") {
      terminal = { status: "cancelled" };
      break;
    }
    await new Promise((r) => setTimeout(r, 280));
  }

  await drainOnce();

  if (!terminal) {
    return { ok: false, error: { code: "BROWSER_SYNC_TIMEOUT", message: "Browser job did not finish within sync window" } };
  }

  if (terminal.status === "cancelled") {
    return { ok: false, error: { code: "BROWSER_JOB_CANCELLED", message: "cancelled" } };
  }

  if (terminal.status !== "succeeded") {
    const err = terminal.error && typeof terminal.error === "object" ? (terminal.error as { message?: string }) : {};
    return {
      ok: false,
      error: {
        code: "BROWSER_JOB_FAILED",
        message: typeof err.message === "string" ? err.message : terminal.status,
      },
    };
  }

  return { ok: true, data: terminal.output ?? {} };
}
