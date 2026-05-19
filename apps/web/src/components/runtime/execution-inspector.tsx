/**
 * Execution inspector — tabbed timeline/graph/replay surfaces with lazy panel mounts.
 */
import { useMemo, useRef, useState, type ReactElement } from "react";
import type { ExecutionTimelineEvent } from "@botmate/shared";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2, X } from "lucide-react";
import { ArtifactExplorer } from "@/components/runtime/artifact-explorer";
import { LineageInspectorPanel } from "@/components/runtime/lineage-inspector";
import { RuntimeGraphWorkspace } from "@/components/runtime/runtime-graph-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useExecutionFactsPagedQuery,
  useExecutionGraphQuery,
  useExecutionTimelineInfiniteQuery,
  useReplayVisibilityMatrixQuery,
  useRuntimeExecutionDetailQuery,
} from "@/lib/hooks/use-runtime-queries";
import { GovernanceVisibilityRibbon } from "@/components/runtime/governance-visibility-ribbon";
import { RuntimeApiErrorCard } from "@/components/runtime/runtime-api-error-card";
import { cn } from "@/lib/utils";

export interface ExecutionInspectorProps {
  executionId: string;
  onClose: () => void;
  /** Embedded inside `/runtime/workspace` — disables sticky sidebar positioning. */
  embedded?: boolean;
}

type InspectorTab =
  | "summary"
  | "timeline"
  | "policies"
  | "replay"
  | "graph"
  | "facts"
  | "lineage"
  | "artifacts";

const TAB_LABELS: Record<InspectorTab, string> = {
  summary: "Сводка",
  timeline: "Хронология",
  policies: "Политики",
  replay: "Повтор",
  graph: "Граф",
  facts: "Факты",
  lineage: "Источник",
  artifacts: "Артефакты",
};

export function ExecutionInspector(props: ExecutionInspectorProps): ReactElement {
  const detail = useRuntimeExecutionDetailQuery(props.executionId);
  const [tab, setTab] = useState<InspectorTab>("summary");

  const browserSessionId = detail.data?.browserRuns[0]?.browserSessionId;

  const chrome = (
    <>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base text-white">Исполнение</CardTitle>
          <CardDescription className="truncate font-mono text-[11px] text-white/55">
            {props.executionId}
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Закрыть инспектор"
          onClick={props.onClose}
        >
          <X className="size-4" />
        </Button>
      </CardHeader>

      <div className="flex flex-wrap gap-1 border-b border-white/10 px-4 pb-3">
        {(Object.keys(TAB_LABELS) as InspectorTab[]).map((k) => (
          <Button
            key={k}
            type="button"
            size="sm"
            variant="outline"
            className={cn(
              "h-8 border-white/15 px-2 text-[10px] text-white/70 hover:bg-white/10",
              tab === k && "border-lime-400/40 bg-lime-500/[0.08] text-lime-100",
            )}
            onClick={() => setTab(k)}
          >
            {TAB_LABELS[k]}
          </Button>
        ))}
      </div>
    </>
  );

  const inner = (
    <Card className={cn("border-white/10 bg-[#1a1a1a]", props.embedded ? "" : "lg:max-h-[calc(100vh-96px)] lg:flex lg:flex-col lg:overflow-hidden")}>
      {chrome}
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden pb-4 lg:min-h-0">
        {tab === "summary" ? <InspectorSummaryTab executionId={props.executionId} detail={detail} /> : null}

        {tab === "timeline" ? <InspectorTimelineTab executionId={props.executionId} /> : null}

        {tab === "policies" ? <InspectorPoliciesTab executionId={props.executionId} /> : null}

        {tab === "replay" ? <InspectorReplayTab executionId={props.executionId} /> : null}

        {tab === "graph" ?
          <div className="min-h-[320px] flex-1 overflow-y-auto">
            <RuntimeGraphWorkspace executionId={props.executionId} />
          </div>
        : null}

        {tab === "facts" ? <InspectorFactsTab executionId={props.executionId} /> : null}

        {tab === "lineage" ?
          <div className="overflow-y-auto">
            <LineageInspectorPanel executionId={props.executionId} />
          </div>
        : null}

        {tab === "artifacts" ?
          <div className="min-h-[320px] flex-1 overflow-y-auto">
            <ArtifactExplorer executionId={props.executionId} browserSessionId={browserSessionId} />
          </div>
        : null}
      </CardContent>
    </Card>
  );

  if (props.embedded) {
    return <div className="flex min-h-0 min-w-0 flex-1 flex-col">{inner}</div>;
  }

  return <aside className="lg:sticky lg:top-20 lg:self-start">{inner}</aside>;
}

function InspectorSummaryTab(props: {
  executionId: string;
  detail: ReturnType<typeof useRuntimeExecutionDetailQuery>;
}): ReactElement {
  const graphMini = useExecutionGraphQuery(props.executionId);
  return (
    <div className="space-y-3 overflow-y-auto">
      {props.detail.isLoading ?
        <div className="flex justify-center py-6">
          <Loader2 className="size-6 animate-spin text-white/35" aria-hidden />
        </div>
      : props.detail.error ?
        <RuntimeApiErrorCard title="Не удалось загрузить исполнение" error={props.detail.error} />
      : props.detail.data ?
        <div className="space-y-2 rounded-md border border-white/10 bg-black/25 p-3 text-xs text-white/75">
          <GovernanceVisibilityRibbon visibility={props.detail.data.governanceVisibility} />
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-white/20 text-[10px]">
              {props.detail.data.execution.status}
            </Badge>
            <Badge variant="outline" className="border-white/20 text-[10px]">
              {props.detail.data.execution.surface}
            </Badge>
            {props.detail.data.execution.browserLinked ?
              <Badge variant="outline" className="border-lime-400/40 text-[10px] text-lime-200">
                в браузере
              </Badge>
            : null}
            {props.detail.data.execution.replayLikely ?
              <Badge variant="outline" className="border-amber-400/40 text-[10px] text-amber-100">
                повтор
              </Badge>
            : null}
          </div>
          <div>
            Ассистент:{" "}
            {props.detail.data.execution.assistantName ?? props.detail.data.execution.assistantId ?? "—"}
          </div>
          <div>Решение политики: {props.detail.data.execution.policyDecision ?? "Не определено"}</div>
          <div>Запусков в браузере: {props.detail.data.browserRuns.length}</div>
        </div>
      : null}

      <div className="rounded-md border border-white/10 bg-black/15 p-2 text-[11px] text-white/65">
        <div className="text-[10px] uppercase tracking-wide text-white/45">Предпросмотр графа</div>
        {graphMini.isLoading ?
          <Loader2 className="mx-auto mt-2 size-4 animate-spin text-white/30" aria-hidden />
        : graphMini.data ?
          <div className="mt-2 space-y-1 font-mono text-[10px] text-white/55">
            <div>
              nodes {graphMini.data.nodes.length} · edges {graphMini.data.edges.length}
            </div>
            <div className="max-h-[96px] overflow-y-auto">
              {graphMini.data.edges.slice(0, 12).map((e) => (
                <div key={e.id} className="truncate">
                  {e.kind}: {e.fromId} → {e.toId}
                </div>
              ))}
            </div>
          </div>
        : null}
      </div>
    </div>
  );
}

function InspectorTimelineTab(props: { executionId: string }): ReactElement {
  const timeline = useExecutionTimelineInfiniteQuery(props.executionId, 36);

  const rows = useMemo(() => timeline.data?.pages.flatMap((p) => p.items) ?? [], [timeline.data?.pages]);

  const timelineParentRef = useRef<HTMLDivElement>(null);

  const timelineVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => timelineParentRef.current,
    estimateSize: () => 76,
    overscan: 12,
    getItemKey: (index) => rows[index]?.id ?? index,
  });

  return (
    <div className="flex min-h-[380px] flex-1 flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-white/45">
          Хронология ({rows.length}{timeline.data?.pages?.[0]?.truncated ? "+" : ""})
        </span>
        {timeline.data?.pages?.[0]?.truncated ?
          <span className="text-[10px] text-amber-200/80">показана часть</span>
        : null}
      </div>
      <div
        ref={timelineParentRef}
        className="min-h-[280px] flex-1 overflow-y-auto rounded-md border border-white/10 bg-black/15 pr-1"
      >
        {timeline.isLoading ?
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-white/35" aria-hidden />
          </div>
        : rows.length === 0 ?
          <p className="px-3 py-8 text-center text-xs text-white/45">Нет событий.</p>
        : <div className="relative w-full" style={{ height: `${timelineVirtualizer.getTotalSize()}px` }}>
            {timelineVirtualizer.getVirtualItems().map((vi) => {
              const row = rows[vi.index];
              if (!row) return null;
              return (
                <div
                  key={vi.key}
                  ref={timelineVirtualizer.measureElement}
                  data-index={vi.index}
                  className="absolute left-0 top-0 w-full px-0"
                  style={{ transform: `translateY(${vi.start}px)` }}
                >
                  <InspectorTimelineRow ev={row} />
                </div>
              );
            })}
          </div>
        }
      </div>
      {timeline.hasNextPage ?
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/15 bg-transparent text-white/85 hover:bg-white/5"
          disabled={timeline.isFetchingNextPage}
          onClick={() => void timeline.fetchNextPage()}
        >
          {timeline.isFetchingNextPage ?
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Загрузка…
            </>
          : "Загрузить ещё"}
        </Button>
      : null}
    </div>
  );
}

function InspectorPoliciesTab(props: { executionId: string }): ReactElement {
  const timeline = useExecutionTimelineInfiniteQuery(props.executionId, 48);

  const policySignals = useMemo(() => {
    const rows = timeline.data?.pages.flatMap((p) => p.items) ?? [];
    return rows.filter(
      (r) => r.lane === "policy" || r.lane === "governance" || Boolean(r.policyReasonCode),
    );
  }, [timeline.data?.pages]);

  if (timeline.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-white/35" aria-hidden />
      </div>
    );
  }

  return (
    <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-md border border-white/10 bg-black/15 p-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-white/45">
        События политик и регулирования (по хронологии)
      </div>
      {policySignals.length === 0 ?
        <p className="text-[11px] text-white/40">Нет выделенных сигналов.</p>
      : policySignals.slice(0, 48).map((s) => <InspectorMiniRow key={`pol:${s.id}`} ev={s} />)}
    </div>
  );
}

function InspectorReplayTab(props: { executionId: string }): ReactElement {
  const replayMx = useReplayVisibilityMatrixQuery(props.executionId);

  const { blockers, risks, infos } = useMemo(() => {
    const rs = replayMx.data?.reasons ?? [];
    const blockers: string[] = [];
    const risks: string[] = [];
    const infos: string[] = [];
    for (const r of rs) {
      if (
        r.includes("DENIED") ||
        r.includes("fatal") ||
        r.toLowerCase().includes("forbidden") ||
        r.includes("replay_marker_absent")
      ) {
        blockers.push(r);
      } else if (r.includes("DRIFT") || r.toLowerCase().includes("dangerous")) {
        risks.push(r);
      } else {
        infos.push(r);
      }
    }
    return { blockers, risks, infos };
  }, [replayMx.data?.reasons]);

  const tier = replayMx.data?.tier;
  const governanceCopy = useMemo(() => {
    if (!replayMx.data) return "";
    if (replayMx.data.reasons.some((r) => r.includes("POLICY_DENIED")))
      return "Зафиксированы отказы политик — повтор исполнения недоступен.";
    if (replayMx.data.reasons.some((r) => r.includes("GOVERNANCE_LINEAGE_DRIFT")))
      return "Зафиксировано расхождение источников — сравните факты с графом событий.";
    if (replayMx.data.reasons.some((r) => r.includes("replay_marker_absent")))
      return "Метка повтора отсутствует — это синтетический запуск, не оригинал.";
    return "Сигналы получены из метаданных запуска и аудита политик.";
  }, [replayMx.data]);

  const eligibility = useMemo(() => {
    if (!replayMx.data) return "—";
    if (replayMx.data.tier === "visible" && replayMx.data.replayLikely)
      return "Доступен безопасный повтор (источники согласованы).";
    if (replayMx.data.tier === "dangerous") return "Опасный источник — только просмотр, без действий.";
    if (replayMx.data.tier === "forbidden") return "Запрещено — есть жёсткие блокирующие сигналы.";
    if (replayMx.data.tier === "restricted") return "Ограничено — сначала разберите события политик.";
    return "Уровень доступа неизвестен — обратитесь к координатору.";
  }, [replayMx.data]);

  return (
    <div className="grid gap-3 rounded-md border border-white/10 bg-black/15 p-3 text-[11px] text-white/70">
      <div className="text-[10px] font-medium uppercase tracking-wide text-white/45">Возможность повтора (только просмотр)</div>
      {replayMx.isLoading ?
        <Loader2 className="mx-auto size-4 animate-spin text-white/30" aria-hidden />
      : replayMx.data ?
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-white/25 text-[10px]">
              уровень · {replayMx.data.tier}
            </Badge>
            <Badge variant="outline" className="border-white/25 text-[10px]">
              повтор возможен · {replayMx.data.replayLikely ? "да" : "нет"}
            </Badge>
            {tier === "dangerous" ?
              <Badge variant="outline" className="border-amber-500/35 text-[10px] text-amber-100">
                риск · внешние вызовы
              </Badge>
            : null}
            {tier === "forbidden" ?
              <Badge variant="outline" className="border-red-500/40 text-[10px] text-red-200">
                блокирующие сигналы
              </Badge>
            : null}
          </div>
          <div className="rounded border border-white/10 bg-black/25 p-2 text-[10px] text-white/55">
            <div className="text-[9px] font-semibold uppercase tracking-wide text-white/35">Доступность</div>
            <div className="mt-1">{eligibility}</div>
          </div>
          <div className="rounded border border-white/10 bg-black/25 p-2 text-[10px] text-white/55">
            <div className="text-[9px] font-semibold uppercase tracking-wide text-white/35">Объяснение</div>
            <div className="mt-1">{governanceCopy}</div>
          </div>
          {blockers.length > 0 ?
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wide text-red-300/60">Блокирующие сигналы</div>
              <ul className="mt-1 max-h-[120px] list-inside list-disc overflow-auto text-white/55">
                {blockers.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          : null}
          {risks.length > 0 ?
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wide text-amber-200/65">Предупреждения</div>
              <ul className="mt-1 max-h-[110px] list-inside list-disc overflow-auto text-white/50">
                {risks.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          : null}
          {infos.length > 0 ?
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wide text-white/35">Дополнительно</div>
              <ul className="mt-1 max-h-[140px] list-inside list-disc overflow-auto text-white/45">
                {infos.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          : null}
        </div>
      : null}
    </div>
  );
}

function InspectorFactsTab(props: { executionId: string }): ReactElement {
  const facts = useExecutionFactsPagedQuery(props.executionId, 1, 25);

  return (
    <div className="grid gap-2 rounded-md border border-white/10 bg-black/15 p-3 text-[11px] text-white/70">
      <div className="text-[10px] font-medium uppercase tracking-wide text-white/45">Сохранённые факты</div>
      {facts.isLoading ?
        <Loader2 className="mx-auto size-4 animate-spin text-white/30" aria-hidden />
      : facts.data ?
        <div className="space-y-2">
          <div>всего {facts.data.total}</div>
          <ul className="max-h-[320px] space-y-1 overflow-y-auto font-mono text-[10px] text-white/55">
            {facts.data.items.map((f) => (
              <li key={f.id} className="truncate">
                {f.lane}:{f.type} · {f.sourceTable}
              </li>
            ))}
          </ul>
        </div>
      : null}
    </div>
  );
}

function InspectorTimelineRow(props: { ev: ExecutionTimelineEvent }): ReactElement {
  return (
    <div className="flex gap-2 border-b border-white/5 px-2 py-2 text-[11px] text-white/75 last:border-b-0">
      <Badge variant="outline" className="h-5 shrink-0 border-white/15 px-1.5 text-[9px] uppercase text-white/55">
        {props.ev.wsEphemeral ? `в реальном времени · ${props.ev.lane}` : props.ev.lane}
      </Badge>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="truncate font-medium text-white/85">{props.ev.title}</div>
        <div className="truncate text-white/45">{props.ev.ts}</div>
        {props.ev.summary ?
          <div className="whitespace-pre-wrap break-words text-white/55">{props.ev.summary}</div>
        : null}
      </div>
    </div>
  );
}

function InspectorMiniRow(props: { ev: ExecutionTimelineEvent }): ReactElement {
  return (
    <div className={cn("rounded border border-white/10 px-2 py-1 text-[10px] text-white/70")}>
      <span className="font-mono text-lime-200/85">{props.ev.policyReasonCode ?? props.ev.title}</span>
      <span className="text-white/35"> · </span>
      <span>{props.ev.summary.slice(0, 160)}</span>
    </div>
  );
}
