import { createHash } from "node:crypto";
import { BrowserFeedSnapshotPayloadSchema, JOB_NAMES } from "@botmate/jobs";
import type { Job } from "bullmq";
import type { PrismaClient } from "@botmate/database";
import type Redis from "ioredis";
import type { BrowserContext } from "playwright";
import { BrowserArtifactKind } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { RealtimeEnvelopeSchema } from "@botmate/shared";
import { mergeHttpAllowHosts, observeOperatorFeedTelemetry, enforceQueueWorkerIngress, publishGovernedRealtimeToRooms, preferredGovernedRealtimeWireMode } from "@botmate/runtime";
import { LocalArtifactStore } from "../artifacts/local-store.js";
import {
  browserArtifactTtlMs,
  isBrowserRuntimeEnabled,
  isOperatorBrowserEnabled,
  operatorFeedArtifactsRotationKeep,
  operatorFeedRealtimeEventsPerSecondCap,
  operatorFeedSnapshotMinIntervalMs,
} from "../constants.js";
import { assertSafeNavigationUrl } from "../policy/nav-validation.js";
import { publishRawRealtimePayload } from "../realtime/redis-publish.js";
import { BrowserRealtimeThrottle } from "../streaming/event-throttle.js";
import { getSharedChromiumBrowser } from "../playwright/chromium.js";

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

function operatorFeedRedisRoom(tenantId: string, token: string): string {
  return `tenant:${tenantId}:browser-feed:${token}`;
}

function redactDomSummary(raw: string): string {
  let s = raw.replace(/\s+/g, " ").trim().slice(0, 8192);
  if (process.env.OPERATOR_FEED_REDACT_EMAILS === "true") {
    s = s.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g, "[redacted-email]");
  }
  return s;
}

async function nextEventSeq(prisma: PrismaClient, browserSessionId: string): Promise<bigint> {
  const agg = await prisma.browserEvent.aggregate({
    where: { browserSessionId },
    _max: { seq: true },
  });
  return (agg._max.seq ?? 0n) + 1n;
}

async function appendSessionBrowserEvent(input: {
  prisma: PrismaClient;
  tenantId: string;
  browserSessionId: string;
  type: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const seq = await nextEventSeq(input.prisma, input.browserSessionId);
  await input.prisma.browserEvent.create({
    data: {
      tenantId: input.tenantId,
      browserSessionId: input.browserSessionId,
      browserRunId: null,
      seq,
      type: input.type,
      payload: input.payload as Prisma.InputJsonValue,
    },
  });
}

async function rotateOperatorFeedArtifacts(input: {
  prisma: PrismaClient;
  store: LocalArtifactStore;
  tenantId: string;
  browserSessionId: string;
  logger: StructuredLoggerLike;
}): Promise<void> {
  const keep = operatorFeedArtifactsRotationKeep();
  const olds = await input.prisma.browserArtifact.findMany({
    where: {
      tenantId: input.tenantId,
      browserSessionId: input.browserSessionId,
      deletedAt: null,
      metadata: { path: ["operatorFeed"], equals: true },
    },
    orderBy: { createdAt: "desc" },
    skip: keep,
    select: { id: true, storageKey: true },
  });
  const now = new Date();
  for (const row of olds) {
    await input.store.delete(row.storageKey);
    await input.prisma.browserArtifact.updateMany({
      where: { id: row.id, tenantId: input.tenantId },
      data: { deletedAt: now },
    });
  }
}

async function publishFeedEnvelope(input: {
  redis: Redis | null;
  throttle: BrowserRealtimeThrottle;
  tenantId: string;
  browserSessionId: string;
  feedRoomToken: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  if (!input.redis) return;
  if (!input.throttle.allow(input.browserSessionId)) return;
  const room = operatorFeedRedisRoom(input.tenantId, input.feedRoomToken);
  const envelope = RealtimeEnvelopeSchema.parse({
    v: 1,
    tenantId: input.tenantId,
    ts: new Date().toISOString(),
    event: "browser.feed_snapshot",
    payload: input.payload,
  });
  await publishGovernedRealtimeToRooms({
    gateway: {
      publish: async (_workspaceId: string, channel: string, wire: string) => {
        await publishRawRealtimePayload(input.redis!, channel, wire);
      },
    },
    publishTenantId: input.tenantId,
    rooms: [room],
    envelope,
    wireMode: preferredGovernedRealtimeWireMode(),
    governanceSurfaceId: "surface.browser.redis.feed_snapshot",
  });
}

export async function executeBrowserFeedSnapshotJob(input: {
  prisma: PrismaClient;
  logger: StructuredLoggerLike;
  job: Job;
  artifactRoot: string;
  redisPublisher: Redis | null;
}): Promise<void> {
  const started = Date.now();
  const data = BrowserFeedSnapshotPayloadSchema.parse(input.job.data);

  enforceQueueWorkerIngress({
    jobName: JOB_NAMES.BROWSER_FEED_SNAPSHOT,
    tenantId: data.tenantId,
    policyContext: data.policyContext,
    executionId: input.job.id ? String(input.job.id) : data.browserSessionId,
    logger: input.logger,
    asyncSurfaceTelemetry: true,
    dequeuePayloadRecord: { ...data },
  });

  if (!isBrowserRuntimeEnabled() || !isOperatorBrowserEnabled()) {
    observeOperatorFeedTelemetry({ ok: false, latencyMs: Date.now() - started, skippedDisabled: true });
    return;
  }

  const throttle = new BrowserRealtimeThrottle(operatorFeedRealtimeEventsPerSecondCap());
  const force = Boolean(data.force);

  const session = await input.prisma.browserSession.findFirst({
    where: { id: data.browserSessionId, tenantId: data.tenantId },
  });

  if (!session?.operatorFeedRoomToken) {
    observeOperatorFeedTelemetry({ ok: false, latencyMs: Date.now() - started, skippedNoRoom: true });
    return;
  }

  const now = new Date();
  const leaseOk =
    (session.operatorLeaseExpiresAt && session.operatorLeaseExpiresAt > now && session.operatorUserId) ||
    (session.takeoverLeaseExpiresAt && session.takeoverLeaseExpiresAt > now && session.takeoverUserId);

  if (!leaseOk) {
    observeOperatorFeedTelemetry({ ok: false, latencyMs: Date.now() - started, skippedNoLease: true });
    return;
  }

  const minIv = operatorFeedSnapshotMinIntervalMs();
  if (
    !force &&
    session.operatorFeedLastEmittedAt &&
    Date.now() - session.operatorFeedLastEmittedAt.getTime() < minIv
  ) {
    observeOperatorFeedTelemetry({ ok: false, latencyMs: Date.now() - started, skippedThrottle: true });
    return;
  }

  const hosts = mergeHttpAllowHosts(process.env.BROWSER_NAVIGATION_ALLOWLIST, parsePolicyHosts(session.policySnapshot));
  const store = new LocalArtifactStore(input.artifactRoot);

  const workerLeaseActive =
    Boolean(session.leaseOwner) && session.leaseExpiresAt ? session.leaseExpiresAt > now : false;

  const activeRun = await input.prisma.browserRun.findFirst({
    where: {
      tenantId: data.tenantId,
      browserSessionId: session.id,
      status: "running",
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, currentStepIndex: true, traceId: true },
  });

  let degraded = workerLeaseActive;
  let urlOut = session.lastUrl ?? "";
  let viewport = { width: 1280, height: 720 };
  let domSummary = "";
  let artifactId: string | null = null;
  let snapshotBytes = 0;
  let snapshotContext: BrowserContext | null = null;

  try {
    if (!degraded) {
      const browser = await getSharedChromiumBrowser();
      let storagePath: string | null = null;
      if (session.storageArtifactId) {
        const art = await input.prisma.browserArtifact.findFirst({
          where: { id: session.storageArtifactId, tenantId: data.tenantId, deletedAt: null },
        });
        if (art) storagePath = store.resolveAbsolutePath(art.storageKey);
      }

      snapshotContext = await browser.newContext({
        acceptDownloads: false,
        viewport,
        ...(storagePath ? { storageState: storagePath } : {}),
      });

      const page = await snapshotContext.newPage();
      page.setDefaultNavigationTimeout(Math.min(60_000, Number(process.env.BROWSER_NAV_TIMEOUT_MS ?? "30000")));

      if (session.lastUrl) {
        assertSafeNavigationUrl(session.lastUrl, hosts);
        await page.goto(session.lastUrl, { waitUntil: "domcontentloaded" });
      }

      urlOut = page.url();
      viewport = page.viewportSize() ?? viewport;

      const rawDom = await page.evaluate<string>(() => {
        const g = globalThis as unknown as {
          document?: { body?: { innerText?: string } };
        };
        try {
          return g.document?.body?.innerText ?? "";
        } catch {
          return "";
        }
      });
      domSummary = redactDomSummary(rawDom);

      const jpeg = await page.screenshot({
        fullPage: false,
        type: "jpeg",
        quality: 62,
      });
      snapshotBytes = jpeg.byteLength;

      const rel = `${data.tenantId}/browser/${session.id}/operator-feed-${Date.now()}.jpg`;
      const wrote = await store.writeBuffer(rel, Buffer.from(jpeg));
      const expiresAt = new Date(Date.now() + browserArtifactTtlMs());
      const row = await input.prisma.browserArtifact.create({
        data: {
          tenantId: data.tenantId,
          browserSessionId: session.id,
          browserRunId: null,
          kind: BrowserArtifactKind.screenshot,
          storageKey: wrote.storageKey,
          byteLength: BigInt(wrote.byteLength),
          sha256: wrote.sha256,
          contentType: "image/jpeg",
          expiresAt,
          metadata: { operatorFeed: true } as Prisma.InputJsonValue,
        },
      });
      artifactId = row.id;

      await rotateOperatorFeedArtifacts({
        prisma: input.prisma,
        store,
        tenantId: data.tenantId,
        browserSessionId: session.id,
        logger: input.logger,
      });
    } else {
      degraded = true;
      domSummary = "";
    }

    const domDigest = createHash("sha256").update(domSummary).digest("hex").slice(0, 32);

    await appendSessionBrowserEvent({
      prisma: input.prisma,
      tenantId: data.tenantId,
      browserSessionId: session.id,
      type: "browser_feed_snapshot",
      payload: {
        artifactId,
        url: urlOut.slice(0, 2048),
        degraded,
        viewport,
        domSummaryDigest: domDigest,
        activeStep:
          activeRun ?
            {
              browserRunId: activeRun.id,
              stepIndex: activeRun.currentStepIndex,
            }
          : null,
        sessionStatus: session.status,
      },
    });

    await publishFeedEnvelope({
      redis: input.redisPublisher,
      throttle,
      tenantId: data.tenantId,
      browserSessionId: session.id,
      feedRoomToken: session.operatorFeedRoomToken,
      payload: {
        browserSessionId: session.id,
        traceId: activeRun?.traceId ?? null,
        artifactId,
        url: urlOut.slice(0, 2048),
        degraded,
        viewport,
        domSummaryPreview:
          process.env.OPERATOR_FEED_AUDIT_DOM_PREVIEW === "true" ? domSummary.slice(0, 1536) : "",
        domSummaryDigest: domDigest,
        activeStep:
          activeRun ?
            {
              browserRunId: activeRun.id,
              stepIndex: activeRun.currentStepIndex,
            }
          : null,
        sessionStatus: session.status,
      },
    });

    await input.prisma.browserSession.updateMany({
      where: { id: session.id, tenantId: data.tenantId },
      data: { operatorFeedLastEmittedAt: new Date() },
    });

    observeOperatorFeedTelemetry({
      ok: true,
      latencyMs: Date.now() - started,
      degraded,
      snapshotBytes,
    });
    input.logger.info(
      { browserSessionId: session.id, degraded, artifactId, snapshotBytes },
      "browser_feed_snapshot_complete",
    );
  } catch (err) {
    observeOperatorFeedTelemetry({
      ok: false,
      latencyMs: Date.now() - started,
      degraded,
      snapshotBytes,
    });
    input.logger.warn(
      { err: err instanceof Error ? err.message : String(err), browserSessionId: session.id },
      "browser_feed_snapshot_failed",
    );
  } finally {
    await snapshotContext?.close().catch(() => undefined);
  }
}
