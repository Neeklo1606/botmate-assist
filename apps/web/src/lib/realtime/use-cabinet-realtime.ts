import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeEnvelope } from "@botmate/shared";
import {
  RealtimeServerEventFrameSchema,
  RealtimeServerPresenceFrameSchema,
} from "@botmate/shared";
import { isRealAuthEnabled } from "@/lib/auth/config";
import { resolveChatPersistence } from "@/lib/chat/config";
import { resolveLeadsPersistence } from "@/lib/leads/config";
import {
  mergeAppendRuntimeActivityStream,
  invalidateRuntimeExecutionProjectionQueries,
  narrowInvalidateRuntimeCaches,
  tryMergeBrowserTimelineFromEnvelope,
  tryMergeLifecycleTimelineFromEnvelope,
  tryMergeNotificationTimelineFromEnvelope,
  tryMergeOperatorTimelineFromEnvelope,
} from "@/lib/realtime/runtime-realtime-merge";
import { runtimeActivityFromEnvelope } from "@/lib/realtime/runtime-activity-event";
import {
  bumpRuntimeInvalidationBurst,
  bumpTimelineMergeHit,
  bumpTimelineMergeMiss,
} from "@/lib/realtime/runtime-client-pressure-metrics";
import { qk } from "@/lib/query-keys";
import type { User } from "@/types/entities";

function wsEndpointFromApiUrl(): string | null {
  const raw =
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_URL ??
    "http://localhost:3001";
  try {
    const u = new URL(raw);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    u.pathname = "/api/v1/realtime/ws";
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

import { realtimeFlagEnabled } from "./realtime-config.js";

export type CabinetRealtimeConnectionState = {
  connected: boolean;
  reconnecting: boolean;
};

/** Latest WS state for observability surfaces (Runtime overview card). */
let cabinetRealtimeState: CabinetRealtimeConnectionState = { connected: false, reconnecting: false };
const cabinetRealtimeListeners = new Set<(state: CabinetRealtimeConnectionState) => void>();

function emitCabinetRealtimeState(next: CabinetRealtimeConnectionState): void {
  if (
    cabinetRealtimeState.connected === next.connected &&
    cabinetRealtimeState.reconnecting === next.reconnecting
  ) {
    return;
  }
  cabinetRealtimeState = next;
  for (const l of cabinetRealtimeListeners) {
    l(next);
  }
}

export function subscribeCabinetRealtimeConnection(
  listener: (state: CabinetRealtimeConnectionState) => void,
): () => void {
  cabinetRealtimeListeners.add(listener);
  listener(cabinetRealtimeState);
  return () => cabinetRealtimeListeners.delete(listener);
}

/** Subscribe once — drives realtime strip on `/runtime*`. */
export function useCabinetRealtimeConnectionState(): CabinetRealtimeConnectionState {
  const [state, setState] = useState(cabinetRealtimeState);
  useEffect(() => subscribeCabinetRealtimeConnection(setState), []);
  return state;
}

/** @deprecated Prefer `useCabinetRealtimeConnectionState().connected` */
export function useCabinetRealtimeConnectionIndicator(): boolean {
  return useCabinetRealtimeConnectionState().connected;
}

export interface CabinetRealtimeOptions {
  /** Current pathname — enables WS bootstrap on `/runtime` without chat/leads API persistence. */
  pathname?: string;
}

/**
 * Workspace WebSocket bridge: tenant rooms (server bootstrap), reconnect backoff, query invalidation.
 *
 * Важно: WebSocket НЕ переподключается при каждой навигации. `pathname` читается
 * через ref, чтобы переходы между разделами (например, `/chat` → `/leads`)
 * не закрывали и не открывали сокет заново — это раньше вызывало мигание баннера
 * "Связь восстанавливается".
 */
export function useCabinetRealtime(user: User | null | undefined, opts?: CabinetRealtimeOptions): void {
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathnameRef = useRef<string | undefined>(opts?.pathname);
  pathnameRef.current = opts?.pathname;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!realtimeFlagEnabled()) return;
    if (!isRealAuthEnabled()) return;
    if (!user?.tenantId || !user.id) return;

    const chatApi = resolveChatPersistence(user) === "api";
    const leadsApi = resolveLeadsPersistence(user) === "api";
    const initialRuntime = opts?.pathname?.startsWith("/runtime") ?? false;
    const bootstrapWs = chatApi || leadsApi || initialRuntime;
    if (!bootstrapWs) return;

    const url = wsEndpointFromApiUrl();
    if (!url) return;

    let cancelled = false;
    const tk = user.tenantId;
    const uid = user.id;

    const isRuntimePage = (): boolean =>
      pathnameRef.current?.startsWith("/runtime") ?? false;

    const handleEnvelope = (env: RealtimeEnvelope) => {
      if (env.tenantId !== user.tenantId) return;

      const activityEvt = runtimeActivityFromEnvelope(env);
      if (activityEvt) mergeAppendRuntimeActivityStream(qc, tk, activityEvt);

      switch (env.event) {
        case "message.created":
        case "message.updated": {
          const sid = env.payload.sessionId;
          if (typeof sid === "string") {
            void qc.invalidateQueries({ queryKey: qk.chat.messagesForSession(tk, uid, sid) });
          }
          void qc.invalidateQueries({ queryKey: qk.chat.sessions(tk, uid) });
          if (isRuntimePage()) narrowInvalidateRuntimeCaches(qc, tk, ["overview", "executions"]);
          break;
        }
        case "session.updated": {
          void qc.invalidateQueries({ queryKey: qk.chat.sessions(tk, uid) });
          const sid = env.payload.sessionId;
          if (typeof sid === "string") {
            void qc.invalidateQueries({ queryKey: qk.chat.messagesForSession(tk, uid, sid) });
          }
          if (isRuntimePage()) narrowInvalidateRuntimeCaches(qc, tk, ["overview", "executions"]);
          break;
        }
        case "lead.updated": {
          void qc.invalidateQueries({ queryKey: qk.leads.root });
          const lid = env.payload.leadId;
          if (typeof lid === "string") {
            void qc.invalidateQueries({ queryKey: qk.leads.detail(tk, uid, lid) });
          }
          break;
        }
        case "assistant.updated": {
          void qc.invalidateQueries({ queryKey: qk.assistants.root });
          void qc.invalidateQueries({ queryKey: qk.assistants.list(tk, uid) });
          const aid = env.payload.assistantId;
          if (typeof aid === "string") {
            void qc.invalidateQueries({ queryKey: qk.assistants.detail(tk, uid, aid) });
          }
          if (isRuntimePage()) narrowInvalidateRuntimeCaches(qc, tk, ["overview", "executions"]);
          break;
        }
        case "notification.created": {
          void qc.invalidateQueries({ queryKey: qk.app.notifications });
          tryMergeNotificationTimelineFromEnvelope(qc, tk, env);
          narrowInvalidateRuntimeCaches(qc, tk, ["overview", "notifications", "executions"]);
          break;
        }
        case "browser.step_started":
        case "browser.step_completed":
        case "browser.snapshot":
        case "browser.error":
        case "browser.feed_snapshot": {
          const merged = tryMergeBrowserTimelineFromEnvelope(qc, tk, env);
          narrowInvalidateRuntimeCaches(
            qc,
            tk,
            merged ? ["overview", "browser-sessions"] : ["overview", "browser-sessions", "executions"],
          );
          break;
        }
        case "operator.joined":
        case "operator.left":
        case "operator.takeover":
        case "operator.released": {
          const merged = tryMergeOperatorTimelineFromEnvelope(qc, tk, env);
          narrowInvalidateRuntimeCaches(
            qc,
            tk,
            merged ? ["overview", "browser-sessions"] : ["overview", "browser-sessions", "executions"],
          );
          break;
        }
        case "runtime.reconcile_hint": {
          narrowInvalidateRuntimeCaches(qc, tk, ["activity-facts", "incidents"]);
          break;
        }
        case "execution.started":
        case "execution.running":
        case "execution.completed":
        case "execution.failed":
        case "execution.blocked":
        case "execution.frozen":
        case "execution.replayed": {
          const merged = tryMergeLifecycleTimelineFromEnvelope(qc, tk, env);
          if (merged) bumpTimelineMergeHit();
          else bumpTimelineMergeMiss();
          const raw = env.payload.executionId ?? env.payload.traceId;
          const execId = typeof raw === "string" && raw.trim() ? raw.trim() : "";
          if (execId) invalidateRuntimeExecutionProjectionQueries(qc, tk, execId);
          narrowInvalidateRuntimeCaches(
            qc,
            tk,
            merged ? ["overview", "incidents"] : ["overview", "executions", "incidents"],
          );
          if (!merged) bumpRuntimeInvalidationBurst();
          break;
        }
        default:
          break;
      }
    };

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
        emitCabinetRealtimeState({ connected: true, reconnecting: false });
        ws.send(
          JSON.stringify({
            op: "presence",
            kind: "operator_online",
            surface: "cabinet",
          }),
        );
      };

      ws.onmessage = (ev) => {
        let json: unknown;
        try {
          json = JSON.parse(String(ev.data));
        } catch {
          return;
        }
        const domain = RealtimeServerEventFrameSchema.safeParse(json);
        if (domain.success) {
          handleEnvelope(domain.data.envelope);
          return;
        }
        const presence = RealtimeServerPresenceFrameSchema.safeParse(json);
        if (presence.success) {
          void qc.invalidateQueries({ queryKey: qk.app.notifications });
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (cancelled) {
          emitCabinetRealtimeState({ connected: false, reconnecting: false });
          return;
        }
        const n = ++attemptRef.current;
        const delay = Math.min(30_000, 1000 * 2 ** Math.min(n, 5));
        emitCabinetRealtimeState({ connected: false, reconnecting: true });
        void import("@/lib/product-analytics").then(({ trackProductEvent }) => {
          try {
            const k = "bm.support.ws_reconnect.last";
            const last = Number(sessionStorage.getItem(k) || 0);
            if (Date.now() - last < 60_000) return;
            sessionStorage.setItem(k, String(Date.now()));
          } catch {
            /* ignore */
          }
          trackProductEvent("support.ws_reconnect");
        });
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => connect(), delay);
      };
    };

    connect();

    const heartbeat = window.setInterval(() => {
      const w = wsRef.current;
      if (w?.readyState === WebSocket.OPEN) {
        w.send(JSON.stringify({ op: "presence", kind: "heartbeat", surface: "cabinet" }));
      }
    }, 55_000);

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      window.clearInterval(heartbeat);
      wsRef.current?.close();
      wsRef.current = null;
      emitCabinetRealtimeState({ connected: false, reconnecting: false });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pathname меняется через pathnameRef, чтобы не пересоздавать сокет на каждой навигации
  }, [qc, user?.tenantId, user?.id]);
}
