/**
 * Phase 11D — bounded internal `assistant.run` enqueue (feature-flagged, ADMIN/OWNER only).
 */
import type { PrismaClient } from "@botmate/database";
import { AssistantRunPayloadSchema, enqueue } from "@botmate/jobs";
import type { AssistantRunEnqueueBody } from "@botmate/shared";
import {
  bumpAssistantRunEnqueueAccepted,
  bumpAssistantRunEnqueueDeduped,
  bumpAssistantRunEnqueueRejected,
} from "./assistant-run-metrics.js";
import { bumpAssistantRunEnqueueForbidden } from "../enterprise/enterprise-security-metrics.js";
import { createTraceId } from "../tracing.js";
import { evaluateUnifiedRuntimePolicy } from "../control-plane/policy.js";
import { mergeExecutionContextSafe } from "../control-plane/execution-lineage-helpers.js";
import { mergePolicyContextSafe } from "../policy/runtime-policy-bundle.js";
export type AssistantRunEnqueueRole = "OWNER" | "ADMIN" | "OPERATOR";

export class AssistantRunEnqueueError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(code: string, message: string, httpStatus: number) {
    super(message);
    this.name = "AssistantRunEnqueueError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export function isAssistantRunEnqueueEnabled(): boolean {
  return process.env.BOTMATE_ASSISTANT_RUN_ENQUEUE_ENABLED?.trim().toLowerCase() === "true";
}

export function assistantRunSessionLockJobId(tenantId: string, sessionId: string): string {
  return `assistant-run:${tenantId}:${sessionId}`;
}

export function assertAssistantRunElevatedRole(role: AssistantRunEnqueueRole): void {
  if (role !== "ADMIN" && role !== "OWNER") {
    bumpAssistantRunEnqueueRejected();
    bumpAssistantRunEnqueueForbidden();
    throw new AssistantRunEnqueueError(
      "ASSISTANT_RUN_FORBIDDEN",
      "Assistant run enqueue requires ADMIN or OWNER role",
      403,
    );
  }
}

const ASSISTANT_RUN_RECENT_USAGE_WINDOW_MS = Number(
  process.env.ASSISTANT_RUN_RECENT_USAGE_WINDOW_MS ?? "120000",
);

export async function assertAssistantRunSessionAvailable(
  prisma: PrismaClient,
  tenantId: string,
  sessionId: string,
): Promise<void> {
  const [streaming, partial] = await Promise.all([
    prisma.message.count({
      where: { tenantId, sessionId, deliveryStatus: "streaming" },
    }),
    prisma.message.count({
      where: { tenantId, sessionId, deliveryStatus: "partial" },
    }),
  ]);
  if (streaming > 0 || partial > 0) {
    bumpAssistantRunEnqueueRejected();
    throw new AssistantRunEnqueueError(
      "SESSION_STREAMING_ACTIVE",
      "Session has an in-flight message (streaming/partial) — wait for sync chat to finish",
      409,
    );
  }

  const recentCutoff = new Date(Date.now() - Math.min(600_000, Math.max(30_000, ASSISTANT_RUN_RECENT_USAGE_WINDOW_MS)));
  const recentWorkerRun = await prisma.aiExecutionUsage.count({
    where: {
      tenantId,
      sessionId,
      createdAt: { gte: recentCutoff },
      jobId: { not: null },
    },
  });
  if (recentWorkerRun > 0) {
    bumpAssistantRunEnqueueRejected();
    throw new AssistantRunEnqueueError(
      "SESSION_RECENT_ASSISTANT_RUN",
      "Session had a recent async assistant run — wait for completion or use returned traceId",
      409,
    );
  }
}

export type AssistantRunEnqueueQueue = {
  getJob(id: string): Promise<{
    getState(): Promise<string>;
    id?: string;
    data: unknown;
  } | undefined>;
  add(name: string, data: Record<string, unknown>, opts?: Record<string, unknown>): Promise<{ id?: string }>;
};

async function resolveActiveJobLock(
  queue: AssistantRunEnqueueQueue,
  jobId: string,
): Promise<{ locked: boolean; traceId?: string; bullJobId?: string }> {
  const existing = await queue.getJob(jobId);
  if (!existing) return { locked: false };
  const state = await existing.getState();
  if (state === "completed" || state === "failed") return { locked: false };
  const data = existing.data as { correlationId?: string } | undefined;
  return {
    locked: true,
    traceId: typeof data?.correlationId === "string" ? data.correlationId : undefined,
    bullJobId: existing.id !== undefined ? String(existing.id) : undefined,
  };
}

export async function enqueueAssistantRunBounded(input: {
  prisma: PrismaClient;
  queue: AssistantRunEnqueueQueue;
  tenantId: string;
  role: AssistantRunEnqueueRole;
  body: AssistantRunEnqueueBody;
}): Promise<{
  enqueued: boolean;
  traceId: string;
  jobId?: string;
  reason?: "SESSION_LOCK";
}> {
  if (!isAssistantRunEnqueueEnabled()) {
    bumpAssistantRunEnqueueRejected();
    throw new AssistantRunEnqueueError(
      "ASSISTANT_RUN_ENQUEUE_DISABLED",
      "Assistant run enqueue is disabled — set BOTMATE_ASSISTANT_RUN_ENQUEUE_ENABLED=true",
      503,
    );
  }

  assertAssistantRunElevatedRole(input.role);

  const { assertCanEnqueueAssistantRun } = await import("../commercial/plan-enforcement.js");
  await assertCanEnqueueAssistantRun(input.prisma, input.tenantId);

  const assistantGate = evaluateUnifiedRuntimePolicy({
    tenantId: input.tenantId,
    subsystem: "assistant",
  });
  if (!assistantGate.ok) {
    bumpAssistantRunEnqueueRejected();
    throw new AssistantRunEnqueueError(assistantGate.code, assistantGate.message, 503);
  }

  const assistant = await input.prisma.assistant.findFirst({
    where: { id: input.body.assistantId, tenantId: input.tenantId },
    select: { id: true },
  });
  if (!assistant) {
    bumpAssistantRunEnqueueRejected();
    throw new AssistantRunEnqueueError("ASSISTANT_NOT_FOUND", "Assistant not found for tenant", 404);
  }

  const session = await input.prisma.chatSession.findFirst({
    where: { id: input.body.sessionId, tenantId: input.tenantId, status: "ACTIVE" },
    select: { id: true, assistantId: true },
  });
  if (!session) {
    bumpAssistantRunEnqueueRejected();
    throw new AssistantRunEnqueueError("SESSION_NOT_FOUND", "Active chat session not found for tenant", 404);
  }

  if (session.assistantId && session.assistantId !== input.body.assistantId) {
    bumpAssistantRunEnqueueRejected();
    throw new AssistantRunEnqueueError(
      "SESSION_ASSISTANT_MISMATCH",
      "Session is bound to a different assistant",
      400,
    );
  }

  await assertAssistantRunSessionAvailable(input.prisma, input.tenantId, input.body.sessionId);

  const traceId = createTraceId(input.body.correlationId);
  const lockJobId = assistantRunSessionLockJobId(input.tenantId, input.body.sessionId);
  const lock = await resolveActiveJobLock(input.queue, lockJobId);
  if (lock.locked) {
    bumpAssistantRunEnqueueDeduped();
    return {
      enqueued: false,
      traceId: lock.traceId ?? traceId,
      jobId: lock.bullJobId,
      reason: "SESSION_LOCK",
    };
  }

  const base = {
    tenantId: input.tenantId,
    assistantId: input.body.assistantId,
    sessionId: input.body.sessionId,
    correlationId: traceId,
    prompt: input.body.prompt?.trim() || undefined,
    queuedAtIso: new Date().toISOString(),
    traceId,
    executionId: traceId,
  };

  const merged = mergePolicyContextSafe(
    mergeExecutionContextSafe(base) as Record<string, unknown>,
  );
  const payload = AssistantRunPayloadSchema.parse(merged);

  try {
    const job = await enqueue.assistantRun(
      input.queue as Parameters<typeof enqueue.assistantRun>[0],
      payload,
      { jobId: lockJobId },
    );
    bumpAssistantRunEnqueueAccepted();
    return {
      enqueued: true,
      traceId,
      jobId: job.id !== undefined ? String(job.id) : lockJobId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/Job .* already exists/i.test(message) || /jobId/i.test(message)) {
      bumpAssistantRunEnqueueDeduped();
      const retryLock = await resolveActiveJobLock(input.queue, lockJobId);
      return {
        enqueued: false,
        traceId: retryLock.traceId ?? traceId,
        jobId: retryLock.bullJobId,
        reason: "SESSION_LOCK",
      };
    }
    throw err;
  }
}
