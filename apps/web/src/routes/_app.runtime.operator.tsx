/**
 * `/runtime/operator` — browser sessions + degraded realtime UX (additive).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRuntimeActivityStreamQuery, useRuntimeBrowserSessionsQuery } from "@/lib/hooks/use-runtime-queries";
import { useCabinetRealtimeConnectionIndicator } from "@/lib/realtime/use-cabinet-realtime";
import { runtimeTenantUiEnabled, runtimeWorkspaceUiEnabled } from "@/lib/runtime/config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/runtime/operator")({
  head: () => ({ meta: [{ title: "Оператор — botme" }] }),
  component: RuntimeOperatorRoute,
});

function RuntimeOperatorRoute() {
  const wsConnected = useCabinetRealtimeConnectionIndicator();
  const sessions = useRuntimeBrowserSessionsQuery(1);
  const activity = useRuntimeActivityStreamQuery();
  const degraded = !wsConnected;

  const browserActs = activity.data?.items.filter((i) => i.kind.startsWith("browser")) ?? [];
  const operatorActs = activity.data?.items.filter((i) => i.kind.startsWith("operator")) ?? [];
  const lastBrowserTs = browserActs.length > 0 ? browserActs[browserActs.length - 1]?.ts : undefined;

  if (!runtimeTenantUiEnabled() || !runtimeWorkspaceUiEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-white">Оператор</h1>
        <p className="text-sm text-white/60">
          Раздел доступен на тарифе «Про». Здесь будут активные сессии браузера и
          действия оператора в реальном времени.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-white">Оператор</h1>
        <p className="max-w-3xl text-sm text-white/60">
          Активные сессии браузера и события оператора в реальном времени.
        </p>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <Badge variant="outline" className={cn("border-white/15", degraded ? "text-amber-200" : "text-lime-200")}>
            связь · {degraded ? "восстановление" : "стабильна"}
          </Badge>
          <Badge variant="outline" className="border-white/15 text-white/55">
            событий браузера · {browserActs.length}
          </Badge>
          <Badge variant="outline" className="border-white/15 text-white/55">
            событий оператора · {operatorActs.length}
          </Badge>
          {lastBrowserTs ?
            <Badge variant="outline" className="border-white/15 font-mono text-[10px] text-white/45">
              последнее · {lastBrowserTs}
            </Badge>
          : null}
        </div>
      </header>

      <Card className="border-white/10 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Активные сессии браузера</CardTitle>
          <CardDescription className="text-[11px] text-white/45">
            Откройте{" "}
            <Link to="/runtime/workspace" className="text-lime-300 underline-offset-4 hover:underline">
              рабочее пространство
            </Link>
            , чтобы увидеть связь с исполнением.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[520px] overflow-auto rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70">Сессия</TableHead>
                  <TableHead className="text-white/70">Статус</TableHead>
                  <TableHead className="text-white/70">Режим</TableHead>
                  <TableHead className="text-white/70">Запусков</TableHead>
                  <TableHead className="text-white/70">Последний URL</TableHead>
                  <TableHead className="text-white/70">Обновлено</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.isLoading ?
                  <TableRow className="border-white/10">
                    <TableCell colSpan={6} className="py-12 text-center">
                      <Loader2 className="mx-auto size-6 animate-spin text-white/35" aria-hidden />
                    </TableCell>
                  </TableRow>
                : sessions.data?.items.map((s) => (
                    <TableRow key={s.id} className="border-white/10">
                      <TableCell className="font-mono text-xs text-lime-200/85">{s.id.slice(0, 14)}…</TableCell>
                      <TableCell className="text-white/75">{s.status}</TableCell>
                      <TableCell className="text-white/65">
                        <span className="inline-flex items-center gap-2">
                          {s.operatorMode}
                          {String(s.operatorMode).toLowerCase().includes("takeover") ?
                            <Badge variant="outline" className="border-amber-400/40 text-[9px] text-amber-100">
                              takeover
                            </Badge>
                          : null}
                        </span>
                      </TableCell>
                      <TableCell className="text-white/65">{s.activeRuns}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs text-white/55">
                        {s.lastUrl ?
                          <a
                            href={s.lastUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-lime-300 underline-offset-4 hover:underline"
                          >
                            открыть
                          </a>
                        : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-white/45">{s.updatedAt}</TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
