/**
 * Readonly lineage projection — derives from tenant runtime APIs only (no graph engine changes).
 */
import { useMemo, type ReactElement } from "react";
import {
  useExecutionGraphQuery,
  useReplayVisibilityMatrixQuery,
  useRuntimeExecutionDetailQuery,
} from "@/lib/hooks/use-runtime-queries";

function pickCorrelation(meta: Record<string, unknown> | null | undefined): string | undefined {
  if (!meta) return undefined;
  const c = meta.correlationId ?? meta.correlation_id;
  return typeof c === "string" && c.trim() ? c.trim() : undefined;
}

function pickParentTrace(meta: Record<string, unknown> | null | undefined): string | undefined {
  if (!meta) return undefined;
  const p = meta.parentTraceId ?? meta.parent_trace_id ?? meta.parentExecutionId ?? meta.parent_execution_id;
  return typeof p === "string" && p.trim() ? p.trim() : undefined;
}

export function LineageInspectorPanel(props: { executionId: string }): ReactElement {
  const detail = useRuntimeExecutionDetailQuery(props.executionId);
  const graph = useExecutionGraphQuery(props.executionId);
  const replay = useReplayVisibilityMatrixQuery(props.executionId);

  const correlationId = useMemo(
    () => pickCorrelation(detail.data?.usageMetadata ?? undefined),
    [detail.data?.usageMetadata],
  );
  const parentTrace = useMemo(
    () => pickParentTrace(detail.data?.usageMetadata ?? undefined),
    [detail.data?.usageMetadata],
  );

  const queueLineage = useMemo(() => {
    const nodes = graph.data?.nodes.filter((n) => n.kind === "queue") ?? [];
    return nodes.map((n) => n.label).slice(0, 12);
  }, [graph.data?.nodes]);

  const browserLineage = useMemo(() => {
    const runs = detail.data?.browserRuns ?? [];
    return runs.map((r) => `${r.id.slice(0, 10)}… · ${r.status}`).slice(0, 8);
  }, [detail.data?.browserRuns]);

  return (
    <div className="space-y-3 rounded-md border border-white/10 bg-black/15 p-3 text-[11px] text-white/75">
      <div className="text-[10px] font-medium uppercase tracking-wide text-white/45">Источник запуска</div>
      <dl className="space-y-2">
        <Row label="trace ID" value={graph.data?.traceId ?? props.executionId} mono />
        <Row label="ID запуска" value={props.executionId} mono />
        <Row label="ID корреляции" value={correlationId ?? "—"} mono />
        <Row label="Родительский запуск / трасса" value={parentTrace ?? "—"} mono />
        <Row
          label="Повтор"
          value={
            replay.data ?
              `${replay.data.replayLikely ? "повтор возможен" : "обычный"} · уровень ${replay.data.tier}`
            : replay.isLoading ? "загрузка…"
            : "—"
          }
        />
        <Row
          label="Решение политики"
          value={detail.data?.execution.policyDecision ?? (detail.isLoading ? "загрузка…" : "—")}
        />
        <div className="space-y-1">
          <dt className="text-white/45">Причины политик и повтора</dt>
          <dd className="text-white/65">
            {replay.data?.reasons.length ?
              <ul className="list-inside list-disc text-white/55">
                {replay.data.reasons.slice(0, 10).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            : <span className="text-white/35">Нет дополнительных причин.</span>}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-white/45">Источник в браузере</dt>
          <dd className="text-white/65">
            {browserLineage.length > 0 ?
              <ul className="font-mono text-[10px] text-white/55">
                {browserLineage.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            : <span className="text-white/35">Запусков в браузере нет.</span>}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-white/45">Очереди исполнения</dt>
          <dd className="text-white/65">
            {queueLineage.length > 0 ?
              <ul className="text-[10px] text-white/55">
                {queueLineage.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            : <span className="text-white/35">Узлов очередей нет.</span>}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Row(props: { label: string; value: string; mono?: boolean }): ReactElement {
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/5 pb-2 last:border-b-0">
      <dt className="text-white/45">{props.label}</dt>
      <dd className={props.mono ? "font-mono text-[10px] text-lime-200/85 break-all" : "text-white/70"}>
        {props.value}
      </dd>
    </div>
  );
}
