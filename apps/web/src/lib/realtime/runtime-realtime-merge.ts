import type { QueryClient } from "@tanstack/react-query";
import type { ExecutionTimelineEvent, ExecutionTimelineResponse, RealtimeEnvelope } from "@botmate/shared";
import { ExecutionTimelineEventSchema } from "@botmate/shared";
import type { RuntimeActivityEvent } from "@/lib/realtime/runtime-activity-event";
import { qk } from "@/lib/query-keys";
import { bumpActivityStreamCapTruncation } from "@/lib/realtime/runtime-client-pressure-metrics";

type TimelineInfiniteCache = {
  pages: ExecutionTimelineResponse[];
  pageParams: (string | undefined)[];
};

function reconcileTimelineAppend(
  prev: ExecutionTimelineEvent[],
  incoming: ExecutionTimelineEvent,
): ExecutionTimelineEvent[] {
  const dk = incoming.dedupeKey;
  if (!dk) return [...prev, incoming];
  const filtered = prev.filter((p) => !(p.wsEphemeral === true && p.dedupeKey === dk));
  return [...filtered, incoming];
}

function patchTimelineInfinite(
  qc: QueryClient,
  tenantKey: string,
  traceId: string,
  build: (prevItems: ExecutionTimelineEvent[]) => ExecutionTimelineEvent[],
): void {
  qc.setQueriesData(
    {
      predicate: (q) =>
        Array.isArray(q.queryKey) &&
        q.queryKey[0] === "runtime" &&
        q.queryKey[1] === "timeline" &&
        q.queryKey[2] === tenantKey &&
        q.queryKey[3] === traceId,
    },
    (prev) => {
      const data = prev as TimelineInfiniteCache | undefined;
      if (!data?.pages?.length) return prev;
      const pages = data.pages.map((page, idx) => {
        if (idx !== data.pages.length - 1) return page;
        const mergedItems = build(page.items);
        const nextItems = mergedItems.sort((a, b) => a.ts.localeCompare(b.ts) || a.id.localeCompare(b.id));
        return { ...page, items: nextItems.slice(-240) };
      });
      return { ...data, pages };
    },
  );
}

export type NarrowRuntimeInvalidateSegment =
  | "overview"
  | "queues"
  | "executions"
  | "notifications"
  | "browser-sessions"
  | "policy-events"
  | "artifacts"
  | "consistency"
  | "activity-facts"
  | "incidents"
  | "execution-notes"
  | "graph";

/** WS-fed activity deque cap — avoids unbounded TanQuery growth on hot tenants. */
export const RUNTIME_ACTIVITY_STREAM_CAP = 400;

/** Phase 11C — cap infinite timeline pages retained in TanStack Query cache. */
export const RUNTIME_TIMELINE_MAX_PAGES = 12;

export function mergeAppendRuntimeActivityStream(qc: QueryClient, tenantKey: string, evt: RuntimeActivityEvent): void {
  qc.setQueryData<{ items: RuntimeActivityEvent[] }>(qk.runtime.activityStream(tenantKey), (prev) => {
    const items = prev?.items ?? [];
    const idx = items.findIndex((it) => it.id === evt.id);
    let next = items.slice();
    if (idx >= 0) next[idx] = evt;
    else next = [...next, evt];
    const capped = next.slice(-RUNTIME_ACTIVITY_STREAM_CAP);
    if (next.length > capped.length) bumpActivityStreamCapTruncation();
    return { items: capped };
  });
}

export function narrowInvalidateRuntimeCaches(
  qc: QueryClient,
  tenantKey: string,
  segments: NarrowRuntimeInvalidateSegment[],
): void {
  if (segments.length === 0) return;
  void qc.invalidateQueries({
    predicate: (q) => {
      if (!Array.isArray(q.queryKey) || q.queryKey[0] !== "runtime" || q.queryKey[2] !== tenantKey) return false;
      const seg = q.queryKey[1];
      return typeof seg === "string" && segments.includes(seg as NarrowRuntimeInvalidateSegment);
    },
  });
}

export function tryMergeBrowserTimelineFromEnvelope(
  qc: QueryClient,
  tenantKey: string,
  env: RealtimeEnvelope,
): boolean {
  const traceIdRaw = env.payload.traceId;
  const traceId = typeof traceIdRaw === "string" && traceIdRaw.trim() ? traceIdRaw.trim() : undefined;
  if (!traceId) return false;

  const browserEvents = new Set<RealtimeEnvelope["event"]>([
    "browser.step_started",
    "browser.step_completed",
    "browser.snapshot",
    "browser.error",
    "browser.feed_snapshot",
  ]);
  if (!browserEvents.has(env.event)) return false;

  const runId = typeof env.payload.runId === "string" ? env.payload.runId : undefined;
  const browserSessionId =
    typeof env.payload.browserSessionId === "string" ? env.payload.browserSessionId : undefined;

  const dedupeKey = `ws:${env.event}:${traceId}:${runId ?? browserSessionId ?? "sess"}`;

  const title =
    env.event === "browser.feed_snapshot" ? "Browser feed snapshot" : env.event.replace(/\./g, " ");

  const evtParsed = ExecutionTimelineEventSchema.safeParse({
    id: `rtl:${env.event}:${env.ts}:${runId ?? browserSessionId ?? "evt"}`,
    ts: env.ts,
    lane: "browser",
    type: env.event.replace(/\./g, "_"),
    status: "live",
    title,
    summary:
      typeof env.payload.message === "string" ?
        env.payload.message.slice(0, 240)
      : typeof env.payload.kind === "string" ?
        env.payload.kind
      : "",
    severity: env.event === "browser.error" ? "critical" : "neutral",
    executionId: traceId,
    traceId,
    assistantId: null,
    browserRunId: runId ?? null,
    dedupeKey,
    wsEphemeral: true,
    metadata: { wsEphemeral: true, dedupeKey, payload: env.payload },
  });

  if (!evtParsed.success) return false;

  patchTimelineInfinite(qc, tenantKey, traceId, (items) => reconcileTimelineAppend(items, evtParsed.data));
  return true;
}

export function tryMergeNotificationTimelineFromEnvelope(
  qc: QueryClient,
  tenantKey: string,
  env: RealtimeEnvelope,
): boolean {
  if (env.event !== "notification.created") return false;
  const traceIdRaw = env.payload.traceId ?? env.payload.executionId;
  const traceId = typeof traceIdRaw === "string" && traceIdRaw.trim() ? traceIdRaw.trim() : undefined;
  if (!traceId) return false;

  const nid = typeof env.payload.notificationId === "string" ? env.payload.notificationId : undefined;
  if (!nid) return false;

  const dedupeKey = `Notification:${nid}:notifications:notification_ws`;

  const evtParsed = ExecutionTimelineEventSchema.safeParse({
    id: `rtl:notification:${nid}:${env.ts}`,
    ts: env.ts,
    lane: "notifications",
    type: "notification_ws_delivery",
    status: "live",
    title: typeof env.payload.title === "string" ? env.payload.title.slice(0, 160) : "Notification",
    summary: typeof env.payload.kind === "string" ? env.payload.kind : "",
    severity: "neutral",
    executionId: traceId,
    traceId,
    assistantId: null,
    notificationId: nid,
    dedupeKey,
    wsEphemeral: true,
    metadata: {
      wsEphemeral: true,
      dedupeKey,
      correlationId: env.payload.correlationId,
      executionId: env.payload.executionId,
      payload: env.payload,
    },
  });

  if (!evtParsed.success) return false;

  patchTimelineInfinite(qc, tenantKey, traceId, (items) => reconcileTimelineAppend(items, evtParsed.data));
  return true;
}

export function tryMergeOperatorTimelineFromEnvelope(
  qc: QueryClient,
  tenantKey: string,
  env: RealtimeEnvelope,
): boolean {
  const opEvents = new Set<RealtimeEnvelope["event"]>([
    "operator.joined",
    "operator.left",
    "operator.takeover",
    "operator.released",
  ]);
  if (!opEvents.has(env.event)) return false;

  const traceIdRaw = env.payload.traceId ?? env.payload.executionId;
  const traceId = typeof traceIdRaw === "string" && traceIdRaw.trim() ? traceIdRaw.trim() : undefined;
  if (!traceId) return false;

  const browserSessionId =
    typeof env.payload.browserSessionId === "string" ? env.payload.browserSessionId : "sess";
  const dedupeKey = `ws:${env.event}:${traceId}:${browserSessionId}`;

  const evtParsed = ExecutionTimelineEventSchema.safeParse({
    id: `rtl:${env.event}:${env.ts}:${browserSessionId}`,
    ts: env.ts,
    lane: "browser",
    type: env.event.replace(/\./g, "_"),
    status: "live",
    title: env.event.replace(/\./g, " "),
    summary:
      typeof env.payload.userId === "string" ? `operator ${env.payload.userId.slice(0, 10)}…` : "",
    severity: "neutral",
    executionId: traceId,
    traceId,
    assistantId: null,
    browserRunId: typeof env.payload.browserRunId === "string" ? env.payload.browserRunId : null,
    dedupeKey,
    wsEphemeral: true,
    metadata: { wsEphemeral: true, dedupeKey, payload: env.payload },
  });

  if (!evtParsed.success) return false;

  patchTimelineInfinite(qc, tenantKey, traceId, (items) => reconcileTimelineAppend(items, evtParsed.data));
  return true;
}

const INBOX_EXECUTION_LIFECYCLE_EVENTS = new Set<RealtimeEnvelope["event"]>([
  "execution.started",
  "execution.running",
  "execution.completed",
  "execution.failed",
  "execution.blocked",
  "execution.frozen",
  "execution.replayed",
]);

const RUNTIME_EXECUTION_SCOPED_SEGMENTS = new Set(["execution", "graph", "replay-matrix"]);

export function invalidateRuntimeExecutionProjectionQueries(
  qc: QueryClient,
  tenantKey: string,
  executionId: string,
): void {
  void qc.invalidateQueries({
    predicate: (q) => {
      if (!Array.isArray(q.queryKey) || q.queryKey[0] !== "runtime") return false;
      const segment = q.queryKey[1];
      if (typeof segment !== "string" || !RUNTIME_EXECUTION_SCOPED_SEGMENTS.has(segment)) {
        return false;
      }
      return q.queryKey[2] === tenantKey && q.queryKey[3] === executionId;
    },
  });
}

function lifecycleTimelineSeverity(ev: RealtimeEnvelope["event"]): "info" | "warn" | "critical" | "neutral" {
  if (ev === "execution.failed" || ev === "execution.blocked") return "critical";
  if (ev === "execution.frozen") return "warn";
  if (ev === "execution.completed" || ev === "execution.replayed") return "neutral";
  return "info";
}

function lifecycleTimelineStatus(ev: RealtimeEnvelope["event"]): string {
  if (ev === "execution.completed") return "completed";
  if (ev === "execution.failed") return "failed";
  if (ev === "execution.blocked") return "blocked";
  if (ev === "execution.running") return "running";
  if (ev === "execution.replayed") return "replay";
  return "live";
}

/** Timeline overlay for **`execution.*`** envelopes (WS-ephemeral, deduped by stable dedupeKey). */
export function tryMergeLifecycleTimelineFromEnvelope(
  qc: QueryClient,
  tenantKey: string,
  env: RealtimeEnvelope,
): boolean {
  if (!INBOX_EXECUTION_LIFECYCLE_EVENTS.has(env.event)) return false;
  const traceRaw = env.payload.executionId ?? env.payload.traceId;
  const traceId = typeof traceRaw === "string" && traceRaw.trim() ? traceRaw.trim() : undefined;
  if (!traceId) return false;

  const dk = `ws:lifecycle:${env.event}:${traceId}`;
  const surface = typeof env.payload.runtimeSurface === "string" ? env.payload.runtimeSurface : "";
  const replayTier = typeof env.payload.replayTier === "string" ? env.payload.replayTier : "";

  const evtParsed = ExecutionTimelineEventSchema.safeParse({
    id: `rtl:lifecycle:${env.event}:${traceId}:${env.ts}`,
    ts: env.ts,
    lane: "governance",
    type: env.event.replace(/\./g, "_"),
    status: lifecycleTimelineStatus(env.event),
    title: env.event.replace(/\./g, " "),
    summary:
      [
        surface ? `surface ${surface}` : null,
        replayTier ? `tier ${replayTier}` : null,
        typeof env.payload.reason === "string" ? env.payload.reason.slice(0, 240) : null,
      ]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 512) || env.event,
    severity: lifecycleTimelineSeverity(env.event),
    executionId: traceId,
    traceId,
    assistantId: null,
    dedupeKey: dk,
    wsEphemeral: true,
    metadata: { wsEphemeral: true, lifecycle: true, envelope: env.event, payload: env.payload },
  });

  if (!evtParsed.success) return false;

  patchTimelineInfinite(qc, tenantKey, traceId, (items) => reconcileTimelineAppend(items, evtParsed.data));
  return true;
}

/** Timeline + auxiliary runtime merges — returns true when at least one merge branch matched envelope shape. */
export function tryMergeRuntimeCachesFromEnvelope(
  qc: QueryClient,
  tenantKey: string,
  env: RealtimeEnvelope,
): boolean {
  return (
    tryMergeBrowserTimelineFromEnvelope(qc, tenantKey, env) ||
    tryMergeNotificationTimelineFromEnvelope(qc, tenantKey, env) ||
    tryMergeOperatorTimelineFromEnvelope(qc, tenantKey, env) ||
    tryMergeLifecycleTimelineFromEnvelope(qc, tenantKey, env)
  );
}
