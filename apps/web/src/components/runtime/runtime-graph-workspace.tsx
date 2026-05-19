/**
 * Readonly execution graph workspace — UI-only hydration caps (no graph engine rewrite).
 */
import { useMemo, useState, type ReactElement } from "react";
import type { ExecutionGraphResponse } from "@botmate/shared";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useExecutionGraphQuery } from "@/lib/hooks/use-runtime-queries";
import { cn } from "@/lib/utils";

const GRAPH_NODE_CAP = 72;
const GRAPH_EDGE_CAP = 144;

type ExecutionGraphNode = ExecutionGraphResponse["nodes"][number];
type ExecutionGraphEdge = ExecutionGraphResponse["edges"][number];

export function RuntimeGraphWorkspace(props: { executionId: string }): ReactElement {
  const graph = useExecutionGraphQuery(props.executionId);
  const [collapsedLanes, setCollapsedLanes] = useState<Record<string, boolean>>({});
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [overlayPolicy, setOverlayPolicy] = useState(true);
  const [overlayReplay, setOverlayReplay] = useState(true);
  const [overlayBrowser, setOverlayBrowser] = useState(true);
  const [overlayQueue, setOverlayQueue] = useState(true);

  const capped = useMemo(() => {
    const nodes = graph.data?.nodes.slice(0, GRAPH_NODE_CAP) ?? [];
    const allowedIds = new Set(nodes.map((n) => n.id));
    const edges =
      graph.data?.edges.filter((e) => allowedIds.has(e.fromId) && allowedIds.has(e.toId)).slice(0, GRAPH_EDGE_CAP) ??
      [];
    return { nodes, edges, truncatedNodes: (graph.data?.nodes.length ?? 0) > GRAPH_NODE_CAP };
  }, [graph.data?.edges, graph.data?.nodes]);

  const lanes = useMemo(() => {
    const m = new Map<string, ExecutionGraphNode[]>();
    for (const n of capped.nodes) {
      const lane = n.lane.trim() ? n.lane : n.kind;
      const arr = m.get(lane) ?? [];
      arr.push(n);
      m.set(lane, arr);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [capped.nodes]);

  const edgeAllowed = useMemo(() => {
    return (e: ExecutionGraphEdge) => {
      if (!overlayPolicy && e.kind === "blocked_by") return false;
      if (!overlayReplay && e.kind === "replay_of") return false;
      return true;
    };
  }, [overlayPolicy, overlayReplay]);

  const incidentEdges = useMemo(() => {
    if (!selectedEdgeId) return null;
    const e = capped.edges.find((x) => x.id === selectedEdgeId);
    return e ? { fromId: e.fromId, toId: e.toId } : null;
  }, [capped.edges, selectedEdgeId]);

  if (graph.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-white/35" aria-hidden />
      </div>
    );
  }

  if (!graph.data) {
    return <p className="text-[11px] text-white/45">Нет данных графа.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-white/10 bg-black/25 px-3 py-2 text-[10px] text-white/65">
        <span className="text-white/45">Overlays</span>
        <label className="flex items-center gap-1.5">
          <Switch checked={overlayPolicy} onCheckedChange={setOverlayPolicy} className="scale-75" />
          policy
        </label>
        <label className="flex items-center gap-1.5">
          <Switch checked={overlayReplay} onCheckedChange={setOverlayReplay} className="scale-75" />
          replay
        </label>
        <label className="flex items-center gap-1.5">
          <Switch checked={overlayBrowser} onCheckedChange={setOverlayBrowser} className="scale-75" />
          browser
        </label>
        <label className="flex items-center gap-1.5">
          <Switch checked={overlayQueue} onCheckedChange={setOverlayQueue} className="scale-75" />
          queue
        </label>
        <Badge variant="outline" className="border-white/15 font-mono text-[9px] text-white/55">
          nodes {capped.nodes.length}/{graph.data.nodes.length}
        </Badge>
        {capped.truncatedNodes ?
          <span className="text-amber-200/80">windowed</span>
        : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-md border border-white/10 bg-black/15 p-2">
          {lanes.map(([lane, nod]) => {
            const collapsed = collapsedLanes[lane] ?? false;
            const filteredNodes = nod.filter((n) => {
              if (!overlayBrowser && n.kind === "browser") return false;
              if (!overlayQueue && n.kind === "queue") return false;
              if (!overlayPolicy && n.kind === "policy") return false;
              if (!overlayReplay && n.kind === "replay") return false;
              return true;
            });
            return (
              <div key={lane} className="rounded border border-white/10 bg-black/20 p-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-white/45">{lane}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[10px] text-white/55 hover:bg-white/10"
                    onClick={() => setCollapsedLanes((p) => ({ ...p, [lane]: !collapsed }))}
                  >
                    {collapsed ? "expand" : "collapse"}
                  </Button>
                </div>
                {!collapsed ?
                  <ul className="space-y-1">
                    {filteredNodes.map((n) => (
                      <li
                        key={n.id}
                        className={cn(
                          "rounded border border-white/5 px-2 py-1 font-mono text-[10px] text-white/65",
                          incidentEdges &&
                            (incidentEdges.fromId === n.id || incidentEdges.toId === n.id) &&
                            "border-lime-400/40 bg-lime-500/[0.06]",
                        )}
                      >
                        <span className="text-white/45">{n.kind}</span> · {n.label}
                      </li>
                    ))}
                  </ul>
                : <div className="text-[10px] text-white/35">{filteredNodes.length} nodes hidden</div>}
              </div>
            );
          })}
        </div>

        <div className="max-h-[420px] overflow-y-auto rounded-md border border-white/10 bg-black/15 p-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-white/45">Edges</div>
          <ul className="mt-2 space-y-1">
            {capped.edges.filter(edgeAllowed).map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded border px-2 py-1 text-left font-mono text-[9px] text-white/65 transition-colors",
                    selectedEdgeId === e.id ? "border-lime-400/50 bg-lime-500/[0.07]" : "border-white/10 hover:bg-white/5",
                  )}
                  onClick={() => setSelectedEdgeId((prev) => (prev === e.id ? null : e.id))}
                >
                  <span className="text-white/45">{e.kind}</span>
                  <div className="truncate text-white/55">
                    {e.fromId} → {e.toId}
                  </div>
                  <div className="truncate text-white/35">{e.label}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
