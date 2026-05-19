import { mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { BrowserRunPayloadSchema, JOB_NAMES } from "@botmate/jobs";
import type { Job } from "bullmq";
import type { PrismaClient } from "@botmate/database";
import type Redis from "ioredis";
import type { BrowserContext } from "playwright";
import { BrowserArtifactKind, type Prisma } from "@prisma/client";
import { RealtimeEnvelopeSchema } from "@botmate/shared";
import { mergeHttpAllowHosts, observeBrowserTelemetry, persistAiUsageLedger, bumpBrowserOperatorExclusiveBlockedRun, enforceQueueWorkerIngress, enforceBrowserCommandPolicyIngress, publishGovernedRealtimeToRooms, normalizeExecutionLineageAttachment, executionLifecyclePayload, publishTenantInboxEnvelope, preferredGovernedRealtimeWireMode } from "@botmate/runtime";
import { LocalArtifactStore } from "../artifacts/local-store.js";
import {
  browserArtifactTtlMs,
  browserIdleSoftMs,
  browserLeaseMs,
  browserMaxArtifactsPerRun,
} from "../constants.js";
import { assertSafeNavigationUrl, assertRoomTenantScoped } from "../policy/nav-validation.js";
import { assertArtifactBudget } from "../policy/quotas.js";
import { publishRawRealtimePayload } from "../realtime/redis-publish.js";
import { BrowserRealtimeThrottle } from "../streaming/event-throttle.js";
import { getSharedChromiumBrowser } from "../playwright/chromium.js";
import type { BrowserStep } from "../step-plan.js";
import { StepPlanSchema } from "../step-plan.js";

export interface StructuredLoggerLike {
  info(meta: Record<string, unknown>, msg: string): void;
  warn(meta: Record<string, unknown>, msg: string): void;
  error(meta: Record<string, unknown>, msg: string): void;
}

function parsePolicyHosts(snapshot: unknown): string[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const h = (snapshot as { allowedHosts?: unknown }).allowedHosts;
  return Array.isArray(h) ? h.map((x) => String(x)).filter(Boolean).slice(0, 48) : [];
}

async function nextEventSeq(prisma: PrismaClient, browserSessionId: string): Promise<bigint> {
  const agg = await prisma.browserEvent.aggregate({
    where: { browserSessionId },
    _max: { seq: true },
  });
  return (agg._max.seq ?? 0n) + 1n;
}

async function appendBrowserEvent(input: {
  prisma: PrismaClient;
  tenantId: string;
  browserSessionId: string;
  browserRunId: string;
  type: string;
  payload: Record<string, unknown>;
}): Promise<bigint> {
  const seq = await nextEventSeq(input.prisma, input.browserSessionId);
  await input.prisma.browserEvent.create({
    data: {
      tenantId: input.tenantId,
      browserSessionId: input.browserSessionId,
      browserRunId: input.browserRunId,
      seq,
      type: input.type,
      payload: input.payload as Prisma.InputJsonValue,
    },
  });
  return seq;
}

async function publishBrowserEnvelope(input: {
  redis: Redis | null;
  throttle: BrowserRealtimeThrottle;
  tenantId: string;
  room: string | undefined;
  browserSessionId: string;
  event: "browser.step_started" | "browser.step_completed" | "browser.snapshot" | "browser.error";
  payload: Record<string, unknown>;
}): Promise<void> {
  if (!input.redis || !input.room) return;
  if (!input.throttle.allow(input.browserSessionId)) return;
  const envelope = RealtimeEnvelopeSchema.parse({
    v: 1,
    tenantId: input.tenantId,
    ts: new Date().toISOString(),
    event: input.event,
    payload: input.payload,
  });
  await publishGovernedRealtimeToRooms({
    gateway: {
      publish: async (_workspaceId: string, channel: string, wire: string) => {
        await publishRawRealtimePayload(input.redis!, channel, wire);
      },
    },
    publishTenantId: input.tenantId,
    rooms: [input.room],
    envelope,
    wireMode: preferredGovernedRealtimeWireMode(),
    governanceSurfaceId: "surface.browser.redis.browser_run",
  });
}

export async function executeBrowserRunJob(input: {
  prisma: PrismaClient;
  logger: StructuredLoggerLike;
  job: Job;
  artifactRoot: string;
  redisPublisher: Redis | null;
  workerInstanceId: string;
}): Promise<void> {
  const started = Date.now();
  const data = BrowserRunPayloadSchema.parse(input.job.data);
  const throttle = new BrowserRealtimeThrottle();

  enforceQueueWorkerIngress({
    jobName: JOB_NAMES.BROWSER_RUN,
    tenantId: data.tenantId,
    policyContext: data.policyContext,
    executionId: data.traceId,
    logger: input.logger,
    dequeuePayloadRecord: { ...data },
  });

  const run = await input.prisma.browserRun.findFirst({
    where: { id: data.browserRunId, tenantId: data.tenantId },
    include: { browserSession: true },
  });

  if (!run || run.browserSessionId !== data.browserSessionId) {
    input.logger.warn({ jobId: input.job.id }, "browser_run_missing_abort");
    return;
  }

  const session = run.browserSession;
  const browserRunId = run.id;
  const browserSessionIdValue = session.id;
  const lineageSeed = normalizeExecutionLineageAttachment(data.executionLineage);
  const replayTier = lineageSeed?.replayOriginExecutionId ? "replay_lineage" : "live";

  async function inboxLifecycle(
    event:
      | "execution.started"
      | "execution.running"
      | "execution.completed"
      | "execution.failed"
      | "execution.blocked"
      | "execution.replayed",
    extra?: Record<string, unknown>,
  ): Promise<void> {
    if (!input.redisPublisher) return;
    await publishTenantInboxEnvelope({
      publishRedis: async (channel, wire) => {
        await input.redisPublisher!.publish(channel, wire);
      },
      tenantId: data.tenantId,
      event,
      governanceSurfaceId: "surface.worker.browser.lifecycle_inbox",
      payload: executionLifecyclePayload({
        traceId: data.traceId,
        executionId: data.traceId,
        correlationId: data.traceId,
        replayTier,
        runtimeSurface: "browser.worker",
        policyDecision: "UNKNOWN",
        extra: { browserRunId, browserSessionId: browserSessionIdValue, ...(extra ?? {}) },
      }),
    });
  }

  if (data.redisRoom) {
    assertRoomTenantScoped(data.redisRoom, data.tenantId);
  }

  const exclusiveGateAt = new Date();
  const takeoverBlocks =
    Boolean(session.takeoverUserId) &&
    session.takeoverLeaseExpiresAt &&
    session.takeoverLeaseExpiresAt > exclusiveGateAt;

  const joinBlocks =
    Boolean(session.operatorUserId) &&
    session.operatorLeaseExpiresAt &&
    session.operatorLeaseExpiresAt > exclusiveGateAt &&
    session.operatorMode === "join";

  if (takeoverBlocks || joinBlocks) {
    await input.prisma.browserRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        error: {
          code: takeoverBlocks ? "browser_takeover_active" : "browser_join_active",
          message: takeoverBlocks ?
            "Human takeover lease blocks automated browser.run"
          : "Operator join lease blocks automated browser.run",
        },
        finishedAt: exclusiveGateAt,
      },
    });
    bumpBrowserOperatorExclusiveBlockedRun();
    observeBrowserTelemetry({ ok: false, latencyMs: Date.now() - started, steps: 0, artifacts: 0 });
    input.logger.warn(
      { browserSessionId: session.id },
      takeoverBlocks ? "browser_takeover_blocked_run" : "browser_join_blocked_run",
    );
    await inboxLifecycle("execution.blocked", {
      reason: takeoverBlocks ? "browser_takeover_active" : "browser_join_active",
    });
    return;
  }

  const hosts = mergeHttpAllowHosts(process.env.BROWSER_NAVIGATION_ALLOWLIST, parsePolicyHosts(session.policySnapshot));

  let artifactWrites = 0;
  let stepsExecuted = 0;

  const leaseMs = browserLeaseMs();
  const idleSoftMs = browserIdleSoftMs();

  const stealLease = await input.prisma.browserSession.updateMany({
    where: {
      id: session.id,
      tenantId: data.tenantId,
      OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: new Date() } }],
    },
    data: {
      leaseOwner: input.workerInstanceId,
      leaseExpiresAt: new Date(Date.now() + leaseMs),
      heartbeatAt: new Date(),
      status: "running",
    },
  });

  if (stealLease.count === 0) {
    await input.prisma.browserRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        error: { code: "browser_lease_contested", message: "Another worker holds an active lease" },
        finishedAt: new Date(),
      },
    });
    observeBrowserTelemetry({ ok: false, latencyMs: Date.now() - started, steps: 0, artifacts: 0 });
    input.logger.warn({ browserSessionId: session.id }, "browser_lease_contested");
    await inboxLifecycle("execution.blocked", { reason: "browser_lease_contested" });
    return;
  }

  await input.prisma.browserRun.update({
    where: { id: run.id },
    data: { status: "running", startedAt: new Date(), currentStepIndex: 0 },
  });

  await inboxLifecycle("execution.started");
  await inboxLifecycle("execution.running");
  if (replayTier === "replay_lineage") {
    await inboxLifecycle("execution.replayed", {
      replayOriginExecutionId: lineageSeed?.replayOriginExecutionId ?? undefined,
    });
  }

  const store = new LocalArtifactStore(input.artifactRoot);
  const steps = StepPlanSchema.parse(run.stepPlan);

  enforceBrowserCommandPolicyIngress({
    tenantId: data.tenantId,
    policyContext: data.policyContext,
    executionId: data.traceId,
    logger: input.logger,
  });

  let heartbeat: NodeJS.Timeout | undefined;
  heartbeat = setInterval(() => {
    void input.prisma.browserSession
      .updateMany({
        where: { id: session.id, tenantId: data.tenantId, leaseOwner: input.workerInstanceId },
        data: {
          leaseExpiresAt: new Date(Date.now() + leaseMs),
          heartbeatAt: new Date(),
        },
      })
      .catch(() => undefined);
  }, 25_000);

  let context: BrowserContext | null = null;

  try {
    const browser = await getSharedChromiumBrowser();

    let storagePath: string | null = null;
    if (session.storageArtifactId) {
      const art = await input.prisma.browserArtifact.findFirst({
        where: { id: session.storageArtifactId, tenantId: data.tenantId, deletedAt: null },
      });
      if (art) storagePath = store.resolveAbsolutePath(art.storageKey);
    }

    context = await browser.newContext({
      acceptDownloads: false,
      viewport: { width: 1280, height: 720 },
      ...(storagePath ? { storageState: storagePath } : {}),
    });

    const page = await context.newPage();
    page.setDefaultNavigationTimeout(Math.min(60_000, Number(process.env.BROWSER_NAV_TIMEOUT_MS ?? "30000")));

    if (steps[0]?.kind !== "open" && session.lastUrl) {
      assertSafeNavigationUrl(session.lastUrl, hosts);
      await page.goto(session.lastUrl, { waitUntil: "domcontentloaded" });
    }

    const artifactSummaries: Array<{ id: string; kind: string }> = [];
    let extractPreview: string | undefined;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]!;
      await input.prisma.browserRun.update({
        where: { id: run.id },
        data: { currentStepIndex: i },
      });

      await appendBrowserEvent({
        prisma: input.prisma,
        tenantId: data.tenantId,
        browserSessionId: session.id,
        browserRunId: run.id,
        type: "browser_step_started",
        payload: { runId: run.id, stepIndex: i, kind: step.kind },
      });

      await publishBrowserEnvelope({
        redis: input.redisPublisher,
        throttle,
        tenantId: data.tenantId,
        room: data.redisRoom,
        browserSessionId: session.id,
        event: "browser.step_started",
        payload: {
          runId: run.id,
          traceId: data.traceId,
          stepIndex: i,
          kind: step.kind,
        },
      });

      await executeStep({
        step,
        page,
        hosts,
        prisma: input.prisma,
        tenantId: data.tenantId,
        browserSessionId: session.id,
        browserRunId: run.id,
        store,
        artifactWritesRef: () => artifactWrites,
        incArtifacts: () => {
          artifactWrites += 1;
        },
        redisPublisher: input.redisPublisher,
        throttle,
        redisRoom: data.redisRoom,
        onScreenshotArtifact: async (id: string) => {
          artifactSummaries.push({ id, kind: "screenshot" });
          await publishBrowserEnvelope({
            redis: input.redisPublisher,
            throttle,
            tenantId: data.tenantId,
            room: data.redisRoom,
            browserSessionId: session.id,
            event: "browser.snapshot",
            payload: {
              runId: run.id,
              traceId: data.traceId,
              stepIndex: i,
              artifactId: id,
              kind: "screenshot",
            },
          });
        },
        onExtractPreview: (txt: string) => {
          extractPreview = txt.slice(0, 2048);
        },
      });
      stepsExecuted += 1;

      await appendBrowserEvent({
        prisma: input.prisma,
        tenantId: data.tenantId,
        browserSessionId: session.id,
        browserRunId: run.id,
        type: "browser_step_completed",
        payload: { runId: run.id, stepIndex: i, kind: step.kind },
      });

      await publishBrowserEnvelope({
        redis: input.redisPublisher,
        throttle,
        tenantId: data.tenantId,
        room: data.redisRoom,
        browserSessionId: session.id,
        event: "browser.step_completed",
        payload: {
          runId: run.id,
          traceId: data.traceId,
          stepIndex: i,
          kind: step.kind,
        },
      });
    }

    const tmpStorageRel = `${data.tenantId}/browser/${session.id}/${run.id}/storage-${run.id}.json`;
    const absStorage = store.resolveAbsolutePath(tmpStorageRel);
    await mkdir(dirname(absStorage), { recursive: true });
    await context.storageState({ path: absStorage });
    const buf = await readFile(absStorage);
    assertArtifactBudget(artifactWrites);
    artifactWrites += 1;
    const wrote = await store.writeBuffer(tmpStorageRel, buf);
    const expiresAt = new Date(Date.now() + browserArtifactTtlMs());
    const storageArtifact = await input.prisma.browserArtifact.create({
      data: {
        tenantId: data.tenantId,
        browserSessionId: session.id,
        browserRunId: run.id,
        kind: BrowserArtifactKind.browser_storage,
        storageKey: wrote.storageKey,
        byteLength: BigInt(wrote.byteLength),
        sha256: wrote.sha256,
        contentType: "application/json",
        expiresAt,
      },
    });

    await input.prisma.browserSession.update({
      where: { id: session.id },
      data: {
        storageArtifactId: storageArtifact.id,
        lastUrl: page.url(),
        status: steps.some((s) => s.kind === "close") ? "terminated" : "idle_soft",
        terminatedAt: steps.some((s) => s.kind === "close") ? new Date() : undefined,
        idleExpiresAt: steps.some((s) => s.kind === "close") ? undefined : new Date(Date.now() + idleSoftMs),
      },
    });

    await input.prisma.browserRun.update({
      where: { id: run.id },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
        output: {
          artifacts: artifactSummaries,
          extractPreview,
          storageArtifactId: storageArtifact.id,
        },
      },
    });

    observeBrowserTelemetry({
      ok: true,
      latencyMs: Date.now() - started,
      steps: stepsExecuted,
      artifacts: artifactWrites,
    });

    const { usageRowId } = await persistAiUsageLedger(input.prisma, {
      tenantId: data.tenantId,
      assistantId: session.assistantId,
      sessionId: session.chatSessionId,
      traceId: data.traceId,
      jobId: input.job.id ?? null,
      sink: "worker_browser_run",
      provider: "browser_worker",
      modelId: "playwright/chromium",
      durationMs: Date.now() - started,
      metadata: {
        browserRunId: run.id,
        browserSessionId: session.id,
        steps: stepsExecuted,
        artifactWrites,
      },
    });

    await inboxLifecycle("execution.completed", {
      usageRowId,
      stepsExecuted,
      artifactWrites,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    observeBrowserTelemetry({
      ok: false,
      latencyMs: Date.now() - started,
      steps: stepsExecuted,
      artifacts: artifactWrites,
    });

    await inboxLifecycle("execution.failed", { message: message.slice(0, 240) });

    await appendBrowserEvent({
      prisma: input.prisma,
      tenantId: data.tenantId,
      browserSessionId: session.id,
      browserRunId: run.id,
      type: "browser_error",
      payload: { runId: run.id, message: message.slice(0, 1024) },
    });

    await publishBrowserEnvelope({
      redis: input.redisPublisher,
      throttle,
      tenantId: data.tenantId,
      room: data.redisRoom,
      browserSessionId: session.id,
      event: "browser.error",
      payload: {
        runId: run.id,
        traceId: data.traceId,
        message: message.slice(0, 512),
      },
    });

    await input.prisma.browserRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        error: { code: "browser_execution_failed", message: message.slice(0, 2048) },
      },
    });

    input.logger.error({ err: message, jobId: input.job.id }, "browser_run_failed");
  } finally {
    await context?.close().catch(() => undefined);
    if (heartbeat) clearInterval(heartbeat);
    await input.prisma.browserSession.updateMany({
      where: { id: session.id, tenantId: data.tenantId, leaseOwner: input.workerInstanceId },
      data: {
        leaseOwner: null,
        leaseExpiresAt: null,
      },
    });
  }
}

async function executeStep(input: {
  step: BrowserStep;
  page: import("playwright").Page;
  hosts: ReadonlySet<string>;
  prisma: PrismaClient;
  tenantId: string;
  browserSessionId: string;
  browserRunId: string;
  store: LocalArtifactStore;
  artifactWritesRef: () => number;
  incArtifacts: () => void;
  redisPublisher: Redis | null;
  throttle: BrowserRealtimeThrottle;
  redisRoom?: string;
  onScreenshotArtifact: (id: string) => Promise<void>;
  onExtractPreview: (text: string) => void;
}): Promise<void> {
  const timeoutDefault = Math.min(60_000, Number(process.env.BROWSER_STEP_TIMEOUT_MS ?? "25000"));

  switch (input.step.kind) {
    case "open": {
      assertSafeNavigationUrl(input.step.url, input.hosts);
      await input.page.goto(input.step.url, {
        waitUntil: input.step.waitUntil ?? "domcontentloaded",
        timeout: input.step.waitUntil === "networkidle" ? timeoutDefault * 2 : timeoutDefault,
      });
      assertSafeNavigationUrl(input.page.url(), input.hosts);
      return;
    }
    case "click": {
      await input.page.click(input.step.selector, {
        timeout: input.step.timeoutMs ?? timeoutDefault,
      });
      return;
    }
    case "type": {
      const loc = input.page.locator(input.step.selector);
      await loc.fill(input.step.text, { timeout: input.step.timeoutMs ?? timeoutDefault });
      return;
    }
    case "extract": {
      const loc = input.page.locator(input.step.selector);
      const raw =
        input.step.mode === "text" ?
          await loc.innerText({ timeout: input.step.timeoutMs ?? timeoutDefault })
        : await loc.innerHTML({ timeout: input.step.timeoutMs ?? timeoutDefault });
      const clipped = raw.slice(0, 256_000);
      input.onExtractPreview(clipped);

      assertArtifactBudget(input.artifactWritesRef());
      input.incArtifacts();
      const rel = `${input.tenantId}/browser/${input.browserSessionId}/${input.browserRunId}/extract-${Date.now()}.json`;
      const wrote = await input.store.writeUtf8(rel, JSON.stringify({ mode: input.step.mode, text: clipped }), {
        contentType: "application/json",
      });
      const expiresAt = new Date(Date.now() + browserArtifactTtlMs());
      await input.prisma.browserArtifact.create({
        data: {
          tenantId: input.tenantId,
          browserSessionId: input.browserSessionId,
          browserRunId: input.browserRunId,
          kind: BrowserArtifactKind.extract,
          storageKey: wrote.storageKey,
          byteLength: BigInt(wrote.byteLength),
          sha256: wrote.sha256,
          contentType: "application/json",
          expiresAt,
        },
      });
      return;
    }
    case "wait": {
      const timeout = input.step.timeoutMs ?? timeoutDefault;
      if (input.step.waitKind === "load") {
        await input.page.waitForLoadState("domcontentloaded", { timeout });
        return;
      }
      if (!input.step.selector) throw new Error("browser_wait_selector_required");
      await input.page.waitForSelector(input.step.selector, { timeout });
      return;
    }
    case "screenshot": {
      assertArtifactBudget(input.artifactWritesRef());
      input.incArtifacts();
      const png = await input.page.screenshot({
        fullPage: Boolean(input.step.fullPage),
        type: "png",
      });
      const rel = `${input.tenantId}/browser/${input.browserSessionId}/${input.browserRunId}/shot-${Date.now()}.png`;
      const wrote = await input.store.writeBuffer(rel, png);
      const expiresAt = new Date(Date.now() + browserArtifactTtlMs());
      const row = await input.prisma.browserArtifact.create({
        data: {
          tenantId: input.tenantId,
          browserSessionId: input.browserSessionId,
          browserRunId: input.browserRunId,
          kind: BrowserArtifactKind.screenshot,
          storageKey: wrote.storageKey,
          byteLength: BigInt(wrote.byteLength),
          sha256: wrote.sha256,
          contentType: "image/png",
          expiresAt,
        },
      });
      await appendBrowserEvent({
        prisma: input.prisma,
        tenantId: input.tenantId,
        browserSessionId: input.browserSessionId,
        browserRunId: input.browserRunId,
        type: "browser_snapshot",
        payload: {
          runId: input.browserRunId,
          artifactId: row.id,
          kind: "screenshot",
          stepIndex: -1,
        },
      });
      await input.onScreenshotArtifact(row.id);
      return;
    }
    case "close": {
      return;
    }
  }
}
