/**
 * TanStack queries for `/api/v1/runtime/*` tenant observability APIs.
 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/auth";
import { apiClient } from "@/lib/api/client";
import { qk } from "@/lib/query-keys";
import { runtimeTenantUiEnabled } from "@/lib/runtime/config";
import type { RuntimeActivityEvent } from "@/lib/realtime/runtime-activity-event";
import { RUNTIME_TIMELINE_MAX_PAGES } from "@/lib/realtime/runtime-realtime-merge";

import type {
  ExecutionOperationalMarkPayload,
  RuntimeConsistencyPersistAckPayload,
  RuntimeIncidentAckPayload,
  RuntimeIncidentCluster,
  RuntimeIncidentSeverity,
} from "@botmate/shared";
import { ApiClientError } from "@botmate/shared";
import { toast } from "sonner";
import type { User } from "@/types/entities";

function tenantSegment(user: User | null | undefined): string | null {
  return user?.tenantId ?? null;
}

export function useRuntimeOverviewQuery() {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const enabled = Boolean(tk) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey: tk ? qk.runtime.overview(tk) : ["runtime", "overview", "__disabled"],
    queryFn: () => apiClient.runtimeOverview(),
    enabled,
    staleTime: 15_000,
  });
}

export function useRuntimeExecutionsQuery(input: { page: number; assistantId?: string }) {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const filtersHash = tk ? qk.runtime.filtersHash({ page: input.page, assistantId: input.assistantId }) : "";
  const enabled = Boolean(tk) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey: tk ? qk.runtime.executions(tk, filtersHash) : ["runtime", "executions", "__disabled"],
    queryFn: () =>
      apiClient.runtimeExecutions({
        page: input.page,
        pageSize: 20,
        ...(input.assistantId ? { assistantId: input.assistantId } : {}),
      }),
    enabled,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });
}

export function useRuntimeBrowserSessionsQuery(page: number) {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const filtersHash = tk ? qk.runtime.filtersHash({ page }) : "";
  const enabled = Boolean(tk) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey: tk ? qk.runtime.browserSessions(tk, filtersHash) : ["runtime", "browser-sessions", "__disabled"],
    queryFn: () => apiClient.runtimeBrowserSessions({ page, pageSize: 15 }),
    enabled,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });
}

export function useRuntimeNotificationsFeedQuery(page: number) {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const filtersHash = tk ? qk.runtime.filtersHash({ page }) : "";
  const enabled = Boolean(tk) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey: tk ? qk.runtime.notifications(tk, filtersHash) : ["runtime", "notifications", "__disabled"],
    queryFn: () => apiClient.runtimeNotifications({ page, pageSize: 15 }),
    enabled,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });
}

export function useRuntimePolicyEventsQuery(page: number) {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const filtersHash = tk ? qk.runtime.filtersHash({ page }) : "";
  const enabled = Boolean(tk) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey: tk ? qk.runtime.policyEvents(tk, filtersHash) : ["runtime", "policy-events", "__disabled"],
    queryFn: () => apiClient.runtimePolicyEvents({ page, pageSize: 25 }),
    enabled,
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useRuntimeExecutionDetailQuery(executionId: string | null) {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const enabled = Boolean(tk && executionId) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey:
      tk && executionId ? qk.runtime.execution(tk, executionId) : ["runtime", "execution", "__disabled"],
    queryFn: () => apiClient.runtimeExecutionDetail(executionId as string),
    enabled,
    staleTime: 30_000,
  });
}

export function useRuntimeQueuesQuery() {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const enabled = Boolean(tk) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey: tk ? qk.runtime.queues(tk) : ["runtime", "queues", "__disabled"],
    queryFn: () => apiClient.runtimeQueues(),
    enabled,
    staleTime: 15_000,
  });
}

export function useExecutionTimelineInfiniteQuery(executionId: string | undefined, pageLimit = 40) {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const enabled = Boolean(tk && executionId) && runtimeTenantUiEnabled();

  return useInfiniteQuery({
    queryKey:
      tk && executionId ?
        qk.runtime.timeline(tk, executionId, pageLimit)
      : ["runtime", "timeline", "__disabled"],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      apiClient.runtimeExecutionTimeline(executionId as string, {
        cursor: pageParam,
        limit: pageLimit,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    maxPages: RUNTIME_TIMELINE_MAX_PAGES,
    enabled,
    staleTime: 10_000,
  });
}

export function useExecutionGraphQuery(executionId: string | undefined) {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const enabled = Boolean(tk && executionId) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey: tk && executionId ? qk.runtime.graph(tk, executionId) : ["runtime", "graph", "__disabled"],
    queryFn: () => apiClient.runtimeExecutionGraph(executionId as string),
    enabled,
    staleTime: 30_000,
  });
}

export function useReplayVisibilityMatrixQuery(executionId: string | undefined) {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const enabled = Boolean(tk && executionId) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey:
      tk && executionId ? qk.runtime.replayMatrix(tk, executionId) : ["runtime", "replay-matrix", "__disabled"],
    queryFn: () => apiClient.runtimeReplayMatrix(executionId as string),
    enabled,
    staleTime: 60_000,
  });
}

export function useExecutionFactsPagedQuery(executionId: string | undefined, page = 1, pageSize = 25) {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const filtersHash = tk ? qk.runtime.filtersHash({ page, pageSize }) : "";
  const enabled = Boolean(tk && executionId) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey:
      tk && executionId ?
        qk.runtime.facts(tk, executionId, filtersHash)
      : ["runtime", "facts", "__disabled"],
    queryFn: () => apiClient.runtimeExecutionFacts(executionId as string, { page, pageSize }),
    enabled,
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });
}

export function useRuntimeArtifactsQuery(input: { page: number; browserSessionId?: string }) {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const filtersHash = tk ? qk.runtime.filtersHash({ page: input.page, browserSessionId: input.browserSessionId }) : "";
  const enabled = Boolean(tk) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey: tk ? qk.runtime.artifacts(tk, filtersHash) : ["runtime", "artifacts", "__disabled"],
    queryFn: () =>
      apiClient.runtimeArtifacts({
        page: input.page,
        pageSize: 20,
        ...(input.browserSessionId ? { browserSessionId: input.browserSessionId } : {}),
      }),
    enabled,
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });
}

export function useRuntimeConsistencyQuery() {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const enabled = Boolean(tk) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey: tk ? qk.runtime.consistency(tk) : ["runtime", "consistency", "__disabled"],
    queryFn: () => apiClient.runtimeConsistencyReport(),
    enabled,
    staleTime: 120_000,
  });
}

export function useRuntimeActivityStreamQuery() {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const enabled = Boolean(tk) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey: tk ? qk.runtime.activityStream(tk) : ["runtime", "activity-stream", "__disabled"],
    queryFn: async (): Promise<{ items: RuntimeActivityEvent[] }> => ({ items: [] }),
    enabled,
    staleTime: Infinity,
    gcTime: 1_800_000,
    placeholderData: { items: [] },
  });
}

export function useRuntimeArtifactDetailQuery(artifactId: string | null) {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const enabled = Boolean(tk && artifactId) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey: tk && artifactId ? qk.runtime.artifact(tk, artifactId) : ["runtime", "artifact", "__disabled"],
    queryFn: () => apiClient.runtimeArtifactDetail(artifactId as string),
    enabled,
    staleTime: 60_000,
  });
}

export function useRuntimeActivityFacts(input: { page?: number; pageSize?: number; kindPrefix?: string }) {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const filtersHash =
    tk !== null ?
      qk.runtime.filtersHash({
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 20,
        kindPrefix: input.kindPrefix,
      })
    : "";
  const enabled = Boolean(tk) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey: tk ? qk.runtime.activityFacts(tk, filtersHash) : ["runtime", "activity-facts", "__disabled"],
    queryFn: () =>
      apiClient.runtimeActivityFacts({
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 20,
        ...(input.kindPrefix ? { kindPrefix: input.kindPrefix } : {}),
      }),
    enabled,
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });
}

export function useRuntimeIncidents(input?: { cluster?: RuntimeIncidentCluster; severity?: RuntimeIncidentSeverity }) {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const filtersHash = tk !== null ? qk.runtime.filtersHash({ cluster: input?.cluster, severity: input?.severity }) : "";
  const enabled = Boolean(tk) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey: tk ? qk.runtime.incidents(tk, filtersHash) : ["runtime", "incidents", "__disabled"],
    queryFn: () =>
      apiClient.runtimeIncidents({
        ...(input?.cluster ? { cluster: input.cluster } : {}),
        ...(input?.severity ? { severity: input.severity } : {}),
      }),
    enabled,
    staleTime: 15_000,
  });
}

export function useRuntimeExecutionNotes(executionId: string | undefined, input?: { page?: number; pageSize?: number }) {
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);
  const pg = input?.page ?? 1;
  const ps = input?.pageSize ?? 20;
  const filtersHash = tk !== null ? qk.runtime.filtersHash({ page: pg, pageSize: ps }) : "";
  const enabled = Boolean(tk && executionId) && runtimeTenantUiEnabled();

  return useQuery({
    queryKey:
      tk && executionId ?
        qk.runtime.executionNotes(tk, executionId, filtersHash)
      : ["runtime", "execution-notes", "__disabled"],
    queryFn: () =>
      apiClient.listRuntimeExecutionNotes(executionId as string, {
        page: pg,
        pageSize: ps,
      }),
    enabled,
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

function invalidateRuntimeIncidentQueries(qc: ReturnType<typeof useQueryClient>, tk: string): void {
  void qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) && q.queryKey[0] === "runtime" && q.queryKey[1] === "incidents" && q.queryKey[2] === tk,
  });
}

/** Bookmark mutations — bounded to execution projection rows (no bookmarks list endpoint). */
export function useRuntimeBookmarks() {
  const qc = useQueryClient();
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);

  const upsertBookmark = useMutation({
    mutationFn: (payload: Parameters<typeof apiClient.upsertRuntimeBookmark>[0]) =>
      apiClient.upsertRuntimeBookmark(payload),
    onSuccess: (_, vars) => {
      if (!tk) return;
      void qc.invalidateQueries({ queryKey: qk.runtime.execution(tk, vars.executionId) });
    },
  });

  const deleteBookmark = useMutation({
    mutationFn: (executionId: string) => apiClient.deleteRuntimeBookmark(executionId),
    onSuccess: (_, execId) => {
      if (!tk) return;
      void qc.invalidateQueries({ queryKey: qk.runtime.execution(tk, execId) });
    },
  });

  return { upsertBookmark, deleteBookmark };
}

export function useRuntimeOperationalMark() {
  const qc = useQueryClient();
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);

  return useMutation({
    mutationFn: (input: { executionId: string; body: ExecutionOperationalMarkPayload }) =>
      apiClient.runtimeOperationalMark(input.executionId, input.body),
    onSuccess: (_, vars) => {
      if (!tk) return;
      void qc.invalidateQueries({ queryKey: qk.runtime.execution(tk, vars.executionId) });
      invalidateRuntimeIncidentQueries(qc, tk);
    },
  });
}

export function useRuntimeConsistencyAck() {
  const qc = useQueryClient();
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);

  return useMutation({
    mutationFn: (body: RuntimeConsistencyPersistAckPayload) => apiClient.acknowledgeRuntimeConsistency(body),
    onSuccess: () => {
      if (!tk) return;
      void qc.invalidateQueries({ queryKey: qk.runtime.consistency(tk) });
      invalidateRuntimeIncidentQueries(qc, tk);
    },
  });
}

export function useRuntimeIncidentAck() {
  const qc = useQueryClient();
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);

  return useMutation({
    mutationFn: (body: RuntimeIncidentAckPayload) => apiClient.acknowledgeRuntimeIncident(body),
    onSuccess: () => {
      if (!tk) return;
      invalidateRuntimeIncidentQueries(qc, tk);
    },
  });
}

export function useRuntimeReconcileEnqueue() {
  const qc = useQueryClient();
  const { data: user } = useCurrentUser();
  const tk = tenantSegment(user);

  return useMutation({
    mutationFn: () => apiClient.runtimeReconcileEnqueue(),
    onError: (err) => {
      if (err instanceof ApiClientError && err.code === "RECONCILE_ENQUEUE_COOLDOWN") {
        toast.error(err.message);
        return;
      }
      if (err instanceof Error && err.message) toast.error(err.message);
    },
    onSuccess: () => {
      if (!tk) return;
      void qc.invalidateQueries({ queryKey: qk.runtime.queues(tk) });
      void qc.invalidateQueries({ queryKey: qk.runtime.consistency(tk) });
      invalidateRuntimeIncidentQueries(qc, tk);
      void qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "runtime" &&
          q.queryKey[1] === "activity-facts" &&
          q.queryKey[2] === tk,
      });
    },
  });
}