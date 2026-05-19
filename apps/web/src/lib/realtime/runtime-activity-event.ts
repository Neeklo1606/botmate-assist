import type { RealtimeEnvelope } from "@botmate/shared";

export type RuntimeActivitySeverity = "info" | "warn" | "critical";

/** Bounded WS-fed activity kinds — projection-backed lifecycle rows remain Phase 9F+. */
export type RuntimeActivityStreamKind =
  | "notification.emitted"
  | "browser.step"
  | "browser.failure"
  | "browser.snapshot"
  | "operator.joined"
  | "operator.left"
  | "operator.takeover"
  | "operator.released"
  | "workspace.refresh_hint"
  | "execution.started"
  | "execution.running"
  | "execution.completed"
  | "execution.failed"
  | "execution.blocked"
  | "execution.frozen"
  | "execution.replayed"
  | "runtime.reconcile_hint";

export interface RuntimeActivityEvent {
  id: string;
  ts: string;
  kind: RuntimeActivityStreamKind;
  traceId?: string;
  summary: string;
  severity: RuntimeActivitySeverity;
}

export function runtimeActivityFromEnvelope(env: RealtimeEnvelope): RuntimeActivityEvent | null {
  switch (env.event) {
    case "notification.created": {
      const traceRaw = env.payload.traceId ?? env.payload.executionId;
      const traceId = typeof traceRaw === "string" && traceRaw.trim() ? traceRaw.trim() : undefined;
      const nid = typeof env.payload.notificationId === "string" ? env.payload.notificationId : "";
      const title = typeof env.payload.title === "string" ? env.payload.title.slice(0, 160) : "Notification";
      return {
        id: `act:notif:${nid}:${env.ts}`,
        ts: env.ts,
        kind: "notification.emitted",
        traceId,
        summary: title,
        severity: "info",
      };
    }
    case "browser.step_started":
    case "browser.step_completed": {
      const traceRaw = env.payload.traceId;
      const traceId = typeof traceRaw === "string" && traceRaw.trim() ? traceRaw.trim() : undefined;
      const runId = typeof env.payload.runId === "string" ? env.payload.runId.slice(0, 12) : "";
      const step =
        typeof env.payload.stepIndex === "number"
          ? `step ${env.payload.stepIndex}`
          : typeof env.payload.kind === "string"
            ? env.payload.kind
            : "";
      return {
        id: `act:${env.event}:${runId}:${env.ts}`,
        ts: env.ts,
        kind: "browser.step",
        traceId,
        summary: `${env.event.replace(/\./g, " ")} ${runId ? `· ${runId}…` : ""} ${step}`.trim(),
        severity: "info",
      };
    }
    case "browser.snapshot":
    case "browser.feed_snapshot": {
      const traceRaw = env.payload.traceId;
      const traceId = typeof traceRaw === "string" && traceRaw.trim() ? traceRaw.trim() : undefined;
      return {
        id: `act:${env.event}:${env.ts}`,
        ts: env.ts,
        kind: "browser.snapshot",
        traceId,
        summary: env.event === "browser.feed_snapshot" ? "Feed snapshot captured" : "Browser snapshot",
        severity: "info",
      };
    }
    case "browser.error": {
      const traceRaw = env.payload.traceId;
      const traceId = typeof traceRaw === "string" && traceRaw.trim() ? traceRaw.trim() : undefined;
      const msg = typeof env.payload.message === "string" ? env.payload.message.slice(0, 240) : "Browser error";
      return {
        id: `act:browser.error:${env.ts}`,
        ts: env.ts,
        kind: "browser.failure",
        traceId,
        summary: msg,
        severity: "critical",
      };
    }
    case "operator.joined":
    case "operator.left":
    case "operator.takeover":
    case "operator.released": {
      const traceRaw = env.payload.traceId ?? env.payload.executionId;
      const traceId = typeof traceRaw === "string" && traceRaw.trim() ? traceRaw.trim() : undefined;
      const uid = typeof env.payload.userId === "string" ? env.payload.userId.slice(0, 12) : "";
      return {
        id: `act:${env.event}:${traceId ?? env.ts}`,
        ts: env.ts,
        kind: env.event,
        traceId,
        summary: uid ? `${env.event.replace(/\./g, " ")} · ${uid}…` : env.event.replace(/\./g, " "),
        severity: "info",
      };
    }
    case "assistant.updated":
      return {
        id: `act:assistant.updated:${env.ts}`,
        ts: env.ts,
        kind: "workspace.refresh_hint",
        summary:
          typeof env.payload.assistantId === "string"
            ? `Assistant updated · ${env.payload.assistantId.slice(0, 10)}…`
            : "Assistant catalog refresh hint",
        severity: "info",
      };
    case "runtime.reconcile_hint": {
      const jobKeyRaw = env.payload.jobId;
      const fallbackKey = (): string => {
        const gen =
          typeof env.payload.generatedAt === "string" && env.payload.generatedAt.trim() ?
            env.payload.generatedAt.trim().slice(0, 22)
          : env.ts.slice(0, 16);
        return `${env.payload.hintKinds ?? "hint"}:${gen}`;
      };
      const jobKey =
        typeof jobKeyRaw === "string" && jobKeyRaw.trim() ? jobKeyRaw.trim() : fallbackKey();
      const hk = typeof env.payload.hintKinds === "number" ? env.payload.hintKinds : "—";
      return {
        id: `act:reconcile:${env.tenantId}:${jobKey}`,
        ts: env.ts,
        kind: "runtime.reconcile_hint",
        summary:
          typeof env.payload.projection === "string"
            ? `Reconcile hints · kinds ${hk} · ${env.payload.projection}`
            : `Reconcile hints · kinds ${hk}`,
        severity: "info",
      };
    }
    case "execution.started":
    case "execution.running":
    case "execution.completed":
    case "execution.failed":
    case "execution.blocked":
    case "execution.frozen":
    case "execution.replayed": {
      const execIdRaw = env.payload.executionId ?? env.payload.traceId;
      const traceId = typeof execIdRaw === "string" && execIdRaw.trim() ? execIdRaw.trim() : "";
      if (!traceId) return null;
      const tier = typeof env.payload.replayTier === "string" ? env.payload.replayTier : "";
      const surface = typeof env.payload.runtimeSurface === "string" ? env.payload.runtimeSurface : "";
      const sev =
        env.event === "execution.failed" || env.event === "execution.blocked" ? "critical"
        : env.event === "execution.frozen" ? "warn"
        : "info";
      return {
        id: `lifecycle:${traceId}:${env.event}`,
        ts: env.ts,
        kind: env.event,
        traceId,
        summary:
          [
            env.event.replace(/\./g, " "),
            surface ? `· ${surface}` : null,
            tier ? `(replay ${tier})` : null,
            typeof env.payload.reason === "string" ? env.payload.reason.slice(0, 120) : null,
          ]
            .filter(Boolean)
            .join(" ")
            .trim(),
        severity: sev,
      };
    }
    default:
      return null;
  }
}
