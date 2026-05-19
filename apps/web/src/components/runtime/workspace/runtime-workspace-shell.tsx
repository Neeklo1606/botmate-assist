/**
 * Phase 9E durable workspace shell — additive `/runtime/workspace` route only.
 */
import { useEffect, useRef, useState, type ReactElement } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2, Pin, PinOff } from "lucide-react";
import { Group, Panel, Separator, useDefaultLayout } from "react-resizable-panels";
import { ArtifactExplorer } from "@/components/runtime/artifact-explorer";
import { ExecutionInspector } from "@/components/runtime/execution-inspector";
import { RuntimeGraphWorkspace } from "@/components/runtime/runtime-graph-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useRuntimeActivityStreamQuery,
  useRuntimeExecutionDetailQuery,
  useRuntimeExecutionsQuery,
} from "@/lib/hooks/use-runtime-queries";
import { useCabinetRealtimeConnectionState } from "@/lib/realtime/use-cabinet-realtime";
import { RealtimeConnectionStrip } from "@/components/runtime/realtime-connection-strip";
import type { RuntimeActivityEvent } from "@/lib/realtime/runtime-activity-event";
import { cn } from "@/lib/utils";

const PINS_LS_KEY = "bm.runtime.workspace.pins.v1";

function readPins(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PINS_LS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ?
        parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 24)
      : [];
  } catch {
    return [];
  }
}

function writePins(ids: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PINS_LS_KEY, JSON.stringify(ids.slice(0, 24)));
}

export interface RuntimeWorkspaceShellProps {
  focusExecutionId?: string;
  onFocusExecution: (executionId: string | undefined) => void;
}

export function RuntimeWorkspaceShell(props: RuntimeWorkspaceShellProps): ReactElement {
  const wsState = useCabinetRealtimeConnectionState();
  const wsConnected = wsState.connected;
  const wsReconnecting = wsState.reconnecting;
  const [pins, setPins] = useState<string[]>(() => readPins());
  const [execPage, setExecPage] = useState(1);
  const executions = useRuntimeExecutionsQuery({ page: execPage });
  const activity = useRuntimeActivityStreamQuery();
  const detailForFocus = useRuntimeExecutionDetailQuery(props.focusExecutionId ?? null);
  const browserSessionId = detailForFocus.data?.browserRuns[0]?.browserSessionId;
  const [stageTab, setStageTab] = useState<"graph" | "artifacts">("graph");

  useEffect(() => {
    writePins(pins);
  }, [pins]);

  function togglePin(id: string): void {
    setPins((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const degraded = !wsConnected;

  const verticalLayout = useDefaultLayout({
    id: "bm-runtime-workspace-vertical-v1",
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  });
  const horizontalLayout = useDefaultLayout({
    id: "bm-runtime-workspace-horizontal-v1",
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  });

  return (
    <div className="space-y-4">
      <RealtimeConnectionStrip />
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-white">Рабочее пространство</h1>
        <p className="max-w-3xl text-sm text-white/60">
          Единый экран для разбора инцидентов: исполнения, стадии, инспектор и активность.
          Расположение панелей сохраняется в браузере.
        </p>
        <div className="flex flex-wrap gap-2 pt-2 text-[11px]">
          <Badge variant="outline" className={cn("border-white/15", degraded ? "text-amber-200" : "text-lime-200")}>
            {wsReconnecting ? "Связь восстанавливается" : degraded ? "Связь отсутствует" : "Связь установлена"}
          </Badge>
          <Badge variant="outline" className="border-white/15 text-white/55">
            событий · {activity.data?.items.length ?? 0}
          </Badge>
        </div>
      </header>

      <Group
        orientation="vertical"
        className="min-h-[calc(100vh-140px)]"
        defaultLayout={verticalLayout.defaultLayout}
        onLayoutChanged={verticalLayout.onLayoutChanged}
      >
        <Panel defaultSize="78%" minSize="55%" id="workspace-stack">
          <Group
            orientation="horizontal"
            className="h-full min-h-[420px]"
            defaultLayout={horizontalLayout.defaultLayout}
            onLayoutChanged={horizontalLayout.onLayoutChanged}
          >
            <Panel defaultSize="22%" minSize="16%" maxSize="34%" id="rail">
              <ExecutionRail
                pins={pins}
                executions={executions}
                execPage={execPage}
                focusExecutionId={props.focusExecutionId}
                onFocus={(id) => props.onFocusExecution(id)}
                onPageChange={setExecPage}
                onTogglePin={togglePin}
              />
            </Panel>
            <Separator className="mx-1 w-1 shrink-0 bg-white/10 hover:bg-lime-400/40" />
            <Panel defaultSize="53%" minSize="38%" id="stage">
              <div className="flex h-full min-h-[420px] flex-col gap-3 pr-1">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={stageTab === "graph" ? "default" : "outline"}
                    className={cn(
                      "h-8 text-[11px]",
                      stageTab === "graph" ? "bg-lime-500/90 text-black hover:bg-lime-400" : "border-white/15 text-white/80",
                    )}
                    onClick={() => setStageTab("graph")}
                  >
                    Граф исполнения
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={stageTab === "artifacts" ? "default" : "outline"}
                    className={cn(
                      "h-8 text-[11px]",
                      stageTab === "artifacts" ?
                        "bg-lime-500/90 text-black hover:bg-lime-400"
                      : "border-white/15 text-white/80",
                    )}
                    onClick={() => setStageTab("artifacts")}
                  >
                    Артефакты
                  </Button>
                </div>
                <Card className="min-h-0 flex-1 border-white/10 bg-[#1a1a1a]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white">Центральная панель</CardTitle>
                    <CardDescription className="text-[11px] text-white/45">
                      Только чтение — без вмешательства в исполнение.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-[calc(100%-88px)] overflow-y-auto">
                    {!props.focusExecutionId ?
                      <p className="text-[11px] text-white/45">
                        Выберите запуск в левой колонке.
                      </p>
                    : stageTab === "graph" ?
                      <RuntimeGraphWorkspace executionId={props.focusExecutionId} />
                    : <ArtifactExplorer executionId={props.focusExecutionId} browserSessionId={browserSessionId} />
                    }
                  </CardContent>
                </Card>
              </div>
            </Panel>
            <Separator className="mx-1 w-1 shrink-0 bg-white/10 hover:bg-lime-400/40" />
            <Panel defaultSize="25%" minSize="18%" id="inspector">
              <div className="h-full min-h-[420px] pl-1">
                {props.focusExecutionId ?
                  <ExecutionInspector
                    embedded
                    executionId={props.focusExecutionId}
                    onClose={() => props.onFocusExecution(undefined)}
                  />
                : <Card className="border-white/10 bg-[#1a1a1a]">
                    <CardHeader>
                      <CardTitle className="text-sm text-white">Инспектор</CardTitle>
                      <CardDescription className="text-[11px] text-white/45">
                        Доступен после выбора запуска.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                }
              </div>
            </Panel>
          </Group>
        </Panel>

        <Separator className="my-2 h-1 shrink-0 bg-white/10 hover:bg-lime-400/40" />

        <Panel defaultSize="22%" minSize="14%" maxSize="38%" id="activity">
          <RuntimeActivityDock items={activity.data?.items ?? []} degraded={degraded} />
        </Panel>
      </Group>
    </div>
  );
}

function ExecutionRail(props: {
  pins: string[];
  executions: ReturnType<typeof useRuntimeExecutionsQuery>;
  execPage: number;
  focusExecutionId?: string;
  onFocus: (id: string) => void;
  onPageChange: (page: number) => void;
  onTogglePin: (id: string) => void;
}): ReactElement {
  const rows = props.executions.data?.items ?? [];

  return (
    <Card className="flex h-full min-h-0 flex-col border-white/10 bg-[#1a1a1a]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white">Список запусков</CardTitle>
        <CardDescription className="text-[11px] text-white/45">Закреплённые запуски сохраняются локально.</CardDescription>
      </CardHeader>
      <CardContent className="flex max-h-[calc(100%-96px)] flex-col gap-3 overflow-hidden">
        {props.pins.length > 0 ?
          <div className="space-y-1 overflow-y-auto rounded-md border border-white/10 bg-black/25 p-2">
            <div className="text-[10px] uppercase tracking-wide text-white/35">Закреплено</div>
            {props.pins.map((id) => {
              const hit = props.executions.data?.items.find((r) => r.executionId === id);
              return (
                <RailRow
                  key={`pin:${id}`}
                  id={id}
                  label={`${id.slice(0, 10)}…`}
                  subtitle={hit ? `${hit.status} · ${hit.surface}` : "закреплено · с другой страницы"}
                  selected={props.focusExecutionId === id}
                  pinned
                  onSelect={() => props.onFocus(id)}
                  onTogglePin={() => props.onTogglePin(id)}
                />
              );
            })}
          </div>
        : null}

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wide text-white/35">Недавние</div>
          {props.executions.isLoading ?
            <Loader2 className="mx-auto size-5 animate-spin text-white/25" aria-hidden />
          : rows.map((row) => (
              <RailRow
                key={row.usageRowId}
                id={row.executionId}
                label={`${row.executionId.slice(0, 10)}…`}
                subtitle={`${row.status} · ${row.surface}`}
                selected={props.focusExecutionId === row.executionId}
                pinned={props.pins.includes(row.executionId)}
                onSelect={() => props.onFocus(row.executionId)}
                onTogglePin={() => props.onTogglePin(row.executionId)}
              />
            ))}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[11px] text-white/45">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-white/15 bg-transparent text-white/75"
            disabled={props.execPage <= 1 || props.executions.isFetching}
            onClick={() => props.onPageChange(Math.max(1, props.execPage - 1))}
          >
            Назад
          </Button>
          <span>стр. {props.execPage}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-white/15 bg-transparent text-white/75"
            disabled={
              props.executions.isFetching ||
              !props.executions.data ||
              props.execPage * props.executions.data.pageSize >= props.executions.data.total
            }
            onClick={() => props.onPageChange(props.execPage + 1)}
          >
            Далее
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RailRow(props: {
  id: string;
  label: string;
  subtitle: string;
  selected: boolean;
  pinned: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
}): ReactElement {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-2 py-1.5 text-[11px]",
        props.selected ? "border-lime-400/40 bg-lime-500/[0.07]" : "border-white/10 bg-black/30 hover:bg-black/45",
      )}
    >
      <button type="button" className="min-w-0 flex-1 text-left text-white/75" onClick={props.onSelect}>
        <div className="truncate font-mono text-[10px] text-lime-200/85">{props.label}</div>
        <div className="truncate text-[10px] text-white/35">{props.subtitle}</div>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-white/45 hover:bg-white/10 hover:text-white"
        aria-label={props.pinned ? "Открепить запуск" : "Закрепить запуск"}
        onClick={(e) => {
          e.stopPropagation();
          props.onTogglePin();
        }}
      >
        {props.pinned ?
          <Pin className="size-4 text-lime-300" aria-hidden />
        : <PinOff className="size-4" aria-hidden />}
      </Button>
    </div>
  );
}

function RuntimeActivityDock(props: { items: RuntimeActivityEvent[]; degraded: boolean }): ReactElement {
  const parentRef = useRef<HTMLDivElement>(null);
  const virt = useVirtualizer({
    count: props.items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 16,
    getItemKey: (i) => props.items[i]?.id ?? i,
  });

  const lastTs = props.items.length > 0 ? props.items[props.items.length - 1]?.ts : undefined;

  return (
    <Card className="border-white/10 bg-[#1a1a1a]">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
        <div>
          <CardTitle className="text-sm text-white">Поток событий</CardTitle>
          <CardDescription className="text-[11px] text-white/45">
            События в реальном времени · в буфере: {props.items.length ? `${props.items.length}` : "0"}
          </CardDescription>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px] text-white/35">
          <span>{props.degraded ? "Связь восстанавливается" : "Связь установлена"}</span>
          {lastTs ? <span className="font-mono text-[9px] text-white/25">последнее {lastTs}</span> : null}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div ref={parentRef} className="max-h-[220px] overflow-auto rounded-md border border-white/10 bg-black/25">
          {props.items.length === 0 ?
            <p className="px-3 py-8 text-center text-[11px] text-white/35">Ожидание доменных событий…</p>
          : <div className="relative w-full" style={{ height: `${virt.getTotalSize()}px` }}>
              {virt.getVirtualItems().map((vi) => {
                const row = props.items[vi.index];
                if (!row) return null;
                return (
                  <div
                    key={vi.key}
                    className="absolute left-0 top-0 w-full border-b border-white/5 px-3 py-2 text-[11px]"
                    style={{ transform: `translateY(${vi.start}px)` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="border-white/15 font-mono text-[9px] text-white/55">
                        {row.kind}
                      </Badge>
                      <span className="font-mono text-[9px] text-white/35">{row.ts}</span>
                    </div>
                    <div className="mt-1 truncate text-white/65">{row.summary}</div>
                    {row.traceId ?
                      <div className="mt-0.5 truncate font-mono text-[9px] text-lime-200/75">{row.traceId}</div>
                    : null}
                  </div>
                );
              })}
            </div>
          }
        </div>
      </CardContent>
    </Card>
  );
}
