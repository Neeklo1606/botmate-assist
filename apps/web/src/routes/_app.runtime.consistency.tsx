/**
 * `/runtime/consistency` — actionable diagnostics workspace (durable ACK via tenant runtime API).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactElement } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRuntimeConsistencyAck, useRuntimeConsistencyQuery } from "@/lib/hooks/use-runtime-queries";
import { runtimeTenantUiEnabled, runtimeWorkspaceUiEnabled } from "@/lib/runtime/config";
import type { RuntimeConsistencyReport } from "@botmate/shared";

export const Route = createFileRoute("/_app/runtime/consistency")({
  head: () => ({ meta: [{ title: "Согласованность — botme" }] }),
  component: RuntimeConsistencyRoute,
});

type IssueGroup = "stale" | "orphan" | "replay" | "governance" | "correlation";

function issueGroup(code: string): IssueGroup {
  if (
    code.includes("STALE") ||
    code === "STALE_TOOL_INVOCATIONS_START" ||
    code === "STALE_BROWSER_RUN_RUNNING"
  )
    return "stale";
  if (code.includes("ORPHAN") || code.includes("MISMATCH") || code.includes("MISSING_USAGE"))
    return "orphan";
  if (code.includes("REPLAY")) return "replay";
  if (code.includes("POLICY") || code.includes("GOVERNANCE")) return "governance";
  return "correlation";
}

function RuntimeConsistencyRoute(): ReactElement {
  const report = useRuntimeConsistencyQuery();
  const durableAck = useRuntimeConsistencyAck();
  const [severityFilter, setSeverityFilter] = useState<Set<string>>(() => new Set(["info", "warn", "critical"]));

  const grouped = useMemo(() => {
    const issues = report.data?.issues ?? [];
    const buckets: Record<IssueGroup, typeof issues> = {
      stale: [],
      orphan: [],
      replay: [],
      governance: [],
      correlation: [],
    };
    for (const issue of issues) {
      if (!severityFilter.has(issue.severity)) continue;
      buckets[issueGroup(issue.code)].push(issue);
    }
    return buckets;
  }, [report.data?.issues, severityFilter]);
  if (!runtimeTenantUiEnabled() || !runtimeWorkspaceUiEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-white">Согласованность</h1>
        <p className="text-sm text-white/60">
          Раздел доступен на тарифе «Про». Здесь видно расхождения в данных и сигналы для
          инженерной команды.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-white">Согласованность</h1>
          <p className="max-w-3xl text-sm text-white/60">
            Группировка диагностических сигналов: устаревшие записи, потерянные связи,
            расхождения политик. Подтверждение сохраняется в БД.
          </p>
          {report.data?.generatedAt ?
            <div className="font-mono text-[11px] text-white/35">обновлено · {report.data.generatedAt}</div>
          : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="border-white/15 bg-transparent text-white/85">
              Уровень
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border-white/10 bg-[#1a1a1a] text-white">
            <DropdownMenuLabel className="text-white/55">Уровень важности</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            {(["info", "warn", "critical"] as const).map((sev) => (
              <DropdownMenuCheckboxItem
                key={sev}
                checked={severityFilter.has(sev)}
                onCheckedChange={(v) =>
                  setSeverityFilter((prev) => {
                    const n = new Set(prev);
                    if (v) n.add(sev);
                    else n.delete(sev);
                    return n;
                  })
                }
                className="focus:bg-white/10"
              >
                {sev}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {report.isLoading ?
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-white/35" aria-hidden />
        </div>
      : report.data ?
        <div className="grid gap-4 lg:grid-cols-2">
          {(Object.keys(grouped) as IssueGroup[]).map((g) => (
            <ConsistencyClusterCard
              key={g}
              title={CLUSTER_TITLE[g]}
              issues={grouped[g]}
              onDurableAcknowledge={(issueCode) => durableAck.mutate({ issueCode })}
              acknowledging={durableAck.isPending}
            />          ))}
        </div>
      : null}
    </div>
  );
}

const CLUSTER_TITLE: Record<IssueGroup, string> = {
  stale: "Устаревшие записи",
  orphan: "Несоответствия и потерянные связи",
  replay: "Расхождения повторов",
  governance: "Расхождения политик",
  correlation: "Пробелы в корреляции",
};

function ConsistencyClusterCard(props: {
  title: string;
  issues: RuntimeConsistencyReport["issues"];
  acknowledging: boolean;
  onDurableAcknowledge: (issueCode: string) => void;
}): ReactElement {
  return (
    <Card className="border-white/10 bg-[#1a1a1a]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white">{props.title}</CardTitle>
        <CardDescription className="text-[11px] text-white/45">отображено после фильтра: {props.issues.length}</CardDescription>
      </CardHeader>
      <CardContent className="max-h-[360px] space-y-2 overflow-y-auto text-[11px] text-white/70">
        {props.issues.length === 0 ?
          <p className="text-white/35">Нет элементов.</p>
        : props.issues.map((issue) => (
            <div key={issue.code} className="rounded border border-white/10 bg-black/25 p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono text-[10px] text-lime-200/85">{issue.code}</div>
                <Badge variant="outline" className="border-white/15 text-[9px]">
                  {issue.severity}
                </Badge>
              </div>
              <div className="mt-1 text-white/55">
                повторов <span className="font-mono">{issue.count}</span>
              </div>
              {issue.sampleIds.length > 0 ?
                <div className="mt-1 truncate text-white/45">примеры · {issue.sampleIds.join(", ")}</div>
              : null}
              <div className="mt-2 text-white/45">{issue.hint}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 border-white/15 bg-transparent text-[11px] text-white/80"
                  asChild
                >
                  <Link to="/runtime/workspace" className="inline-flex items-center">
                    Рабочее пространство
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 border-white/15 bg-transparent text-[11px] text-white/80"
                  asChild
                >
                  <Link to="/runtime/incidents" className="inline-flex items-center">
                    Инциденты
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 border-white/15 bg-transparent text-[11px] text-white/80"
                  asChild
                >
                  <Link to="/runtime" className="inline-flex items-center">
                    Журнал исполнений
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 text-[11px] text-white/55 hover:bg-white/10"
                  disabled={props.acknowledging}
                  onClick={() => props.onDurableAcknowledge(issue.code)}
                >
                  Подтвердить
                </Button>
              </div>
            </div>
          ))
        }
      </CardContent>
    </Card>
  );
}
