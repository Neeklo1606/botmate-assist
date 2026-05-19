/**
 * `/runtime/incidents` — grouped incident projection + durable ack (Phase 9F).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactElement } from "react";
import { Loader2 } from "lucide-react";
import type { RuntimeIncidentRow } from "@botmate/shared";
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
import {
  useRuntimeIncidentAck,
  useRuntimeIncidents,
  useRuntimeReconcileEnqueue,
} from "@/lib/hooks/use-runtime-queries";
import { runtimeTenantUiEnabled, runtimeWorkspaceUiEnabled } from "@/lib/runtime/config";
import { useProductPageView } from "@/lib/hooks/use-product-page-view";
import { RealtimeConnectionStrip } from "@/components/runtime/realtime-connection-strip";
import { RuntimeApiErrorCard } from "@/components/runtime/runtime-api-error-card";
import { IncidentsExplainerPanel } from "@/components/product/incidents-explainer-panel";
import { RuntimeUxModeToggle } from "@/components/product/runtime-ux-mode-toggle";

export const Route = createFileRoute("/_app/runtime/incidents")({
  head: () => ({ meta: [{ title: "Инциденты — botme" }] }),
  component: RuntimeIncidentsRoute,
});

const CLUSTER_LABEL: Record<RuntimeIncidentRow["cluster"], string> = {
  consistency: "Согласованность",
  reconcile: "Сверка",
  policy: "Политики",
  browser: "Браузер",
  queue: "Очереди",
  correlation: "Корреляция",
  governance_mark: "Аудит",
  replay: "Повторы",
};

function RuntimeIncidentsRoute(): ReactElement {
  useProductPageView({
    sessionKey: "runtime-incidents",
    event: "activation.incidents_opened",
    milestoneSuffix: "incidents_opened",
    enabled: runtimeTenantUiEnabled() && runtimeWorkspaceUiEnabled(),
  });

  const [clusterFilter, setClusterFilter] = useState<string | undefined>(undefined);
  const [severityFilter, setSeverityFilter] = useState<Set<string>>(
    () => new Set(["info", "warn", "critical"]),
  );

  const incidents = useRuntimeIncidents({
    ...(clusterFilter ? { cluster: clusterFilter as RuntimeIncidentRow["cluster"] } : {}),
  });
  const ack = useRuntimeIncidentAck();
  const reconcile = useRuntimeReconcileEnqueue();

  const filteredItems = useMemo(() => {
    const rows = incidents.data?.items ?? [];
    return rows.filter((r) => severityFilter.has(r.severity));
  }, [incidents.data?.items, severityFilter]);

  const grouped = useMemo(() => {
    const m = new Map<RuntimeIncidentRow["cluster"], RuntimeIncidentRow[]>();
    for (const it of filteredItems) {
      const arr = m.get(it.cluster) ?? [];
      arr.push(it);
      m.set(it.cluster, arr);
    }
    return m;
  }, [filteredItems]);

  if (!runtimeTenantUiEnabled() || !runtimeWorkspaceUiEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-white">Инциденты</h1>
        <p className="text-sm text-white/60">
          Раздел доступен на тарифе «Про». Здесь собираются инциденты по разным кластерам:
          согласованность данных, сверка, политики и аудит.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RealtimeConnectionStrip />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <IncidentsExplainerPanel />
        <RuntimeUxModeToggle />
      </div>
      <RuntimeApiErrorCard title="Не удалось загрузить инциденты" error={incidents.error} />
      <RuntimeApiErrorCard title="Не удалось запустить сверку" error={reconcile.error} />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-white">Инциденты</h1>
          <p className="max-w-3xl text-sm text-white/60">
            Сводка по согласованности данных, сверке, политикам и аудиту. Подтверждение
            (acknowledge) сохраняется в БД.
          </p>
          {incidents.data?.generatedAt ?
            <div className="font-mono text-[11px] text-white/35">обновлено · {incidents.data.generatedAt}</div>
          : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="border-white/15 bg-transparent text-white/85">
                Кластер
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-white/10 bg-[#1a1a1a] text-white">
              <DropdownMenuLabel className="text-white/55">Категория</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuCheckboxItem
                checked={clusterFilter === undefined}
                className="focus:bg-white/10"
                onCheckedChange={(v) => {
                  if (v) setClusterFilter(undefined);
                }}
              >
                Все категории
              </DropdownMenuCheckboxItem>
              {(Object.keys(CLUSTER_LABEL) as RuntimeIncidentRow["cluster"][]).map((c) => (
                <DropdownMenuCheckboxItem
                  key={c}
                  checked={clusterFilter === c}
                  className="focus:bg-white/10"
                  onCheckedChange={() => setClusterFilter(c)}
                >
                  {CLUSTER_LABEL[c]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
                  className="focus:bg-white/10"
                  onCheckedChange={(v) =>
                    setSeverityFilter((prev) => {
                      const n = new Set(prev);
                      if (v) n.add(sev);
                      else n.delete(sev);
                      return n;
                    })
                  }
                >
                  {sev}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={reconcile.isPending}
            className="border-white/15 bg-transparent text-[11px] text-white/80"
            onClick={() => reconcile.mutate()}
          >
            {reconcile.isPending ?
              <>
                <Loader2 className="mr-2 inline size-3 animate-spin" aria-hidden /> Запускаем…
              </>
            : "Запустить сверку"}
          </Button>
        </div>
      </header>

      {incidents.isLoading ?
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-white/35" aria-hidden />
        </div>
      : grouped.size === 0 ?
        <p className="text-sm text-white/45">Нет инцидентов под текущие фильтры.</p>
      : (
        <div className="grid gap-4 lg:grid-cols-2">
          {[...grouped.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([cluster, items]) => (
              <Card key={cluster} className="border-white/10 bg-[#1a1a1a]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">{CLUSTER_LABEL[cluster]}</CardTitle>
                  <CardDescription className="text-[11px] text-white/45">записей: {items.length}</CardDescription>
                </CardHeader>
                <CardContent className="max-h-[420px] space-y-2 overflow-y-auto text-[11px] text-white/70">
                  {items.map((it) => (
                    <div key={it.incidentKey} className="rounded border border-white/10 bg-black/25 p-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-mono text-[10px] text-lime-200/85">{it.incidentKey}</div>
                        <Badge variant="outline" className="border-white/15 text-[9px]">
                          {it.severity}
                        </Badge>
                      </div>
                      <div className="mt-1 font-medium text-white/85">{it.title}</div>
                      <div className="mt-1 text-white/45">{it.summary}</div>
                      {it.executionId ?
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="outline" className="h-8 border-white/15 bg-transparent" asChild>
                            <Link to="/runtime/workspace" search={{ focus: it.executionId ?? undefined }}>
                              Рабочее пространство
                            </Link>
                          </Button>
                          <Button type="button" size="sm" variant="outline" className="h-8 border-white/15 bg-transparent" asChild>
                            <Link to="/runtime" search={{ execution: it.executionId ?? undefined }}>
                              Открыть
                            </Link>
                          </Button>
                        </div>
                      : null}
                      {it.remediationHints.length > 0 ?
                        <ul className="mt-2 list-inside list-disc text-white/40">
                          {it.remediationHints.slice(0, 6).map((h: string, i: number) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 text-[11px] text-white/60 hover:bg-white/10"
                          disabled={ack.isPending}
                          onClick={() => ack.mutate({ incidentKey: it.incidentKey })}
                        >
                          Подтвердить
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
