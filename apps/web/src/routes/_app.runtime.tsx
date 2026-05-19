/**
 * /runtime — tenant-safe runtime observability (Phase 9B foundation).
 *
 * Data: `/api/v1/runtime/*` via cookie workspace auth. Does not call `/health/runtime*`.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ApiClientError } from "@botmate/shared";
import type { RuntimeExecutionRow } from "@botmate/shared";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExecutionInspector } from "@/components/runtime/execution-inspector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAssistants } from "@/lib/hooks/use-app";
import {
  useRuntimeBrowserSessionsQuery,
  useRuntimeConsistencyQuery,
  useRuntimeExecutionsQuery,
  useRuntimeNotificationsFeedQuery,
  useRuntimeOverviewQuery,
  useRuntimePolicyEventsQuery,
  useRuntimeQueuesQuery,
} from "@/lib/hooks/use-runtime-queries";
import { useCabinetRealtimeConnectionState } from "@/lib/realtime/use-cabinet-realtime";
import { RealtimeConnectionStrip } from "@/components/runtime/realtime-connection-strip";
import { RuntimeApiErrorCard } from "@/components/runtime/runtime-api-error-card";
import { runtimeTenantUiEnabled } from "@/lib/runtime/config";
import { useProductPageView } from "@/lib/hooks/use-product-page-view";
import { ProductFeedbackButton } from "@/components/product/product-feedback-button";
import { RuntimeOnboardingPanel } from "@/components/product/runtime-onboarding-panel";
import { RuntimeUxModeToggle } from "@/components/product/runtime-ux-mode-toggle";
import { RuntimeAdvancedGate } from "@/components/product/runtime-advanced-gate";
import { BrowserOnboardingHint } from "@/components/product/browser-onboarding-hint";
import { isRuntimeAdvancedMode } from "@/lib/product/runtime-ux-mode";
import { CABINET_RU } from "@/lib/i18n/cabinet-ru";
import { cn } from "@/lib/utils";

interface RuntimeSearch {
  execution?: string;
}

export const Route = createFileRoute("/_app/runtime")({
  validateSearch: (search: Record<string, unknown>): RuntimeSearch => ({
    execution: typeof search.execution === "string" && search.execution.trim() ? search.execution.trim() : undefined,
  }),
  head: () => ({
    meta: [{ title: "Исполнения — botme" }],
  }),
  component: RuntimeOverviewPage,
});

const GOVERNANCE_ROADMAP_CODES = [
  "POLICY_DENIED",
  "POLICY_FREEZE",
  "POLICY_CONTEXT_MISSING",
  "GOVERNANCE_REALTIME_MISMATCH",
  "GOVERNANCE_LINEAGE_DRIFT",
  "POLICY_SNAPSHOT_STALE",
] as const;

function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${ms} мс`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} с`;
  return `${Math.round(ms / 60_000)} мин`;
}

function policyBadgeVariant(decision: RuntimeExecutionRow["policyDecision"]): string {
  switch (decision) {
    case "DENY":
      return "border-red-500/60 text-red-300";
    case "WARN":
      return "border-amber-500/60 text-amber-200";
    case "ALLOW":
      return "border-emerald-500/60 text-emerald-200";
    default:
      return "border-white/15 text-muted-foreground";
  }
}

function RuntimeOverviewPage() {
  useProductPageView({
    sessionKey: "runtime-overview",
    event: "activation.runtime_opened",
    milestoneSuffix: "runtime_opened",
    enabled: runtimeTenantUiEnabled(),
  });

  const wsState = useCabinetRealtimeConnectionState();
  const wsConnected = wsState.connected;
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [execPage, setExecPage] = useState(1);
  const [browserPage, setBrowserPage] = useState(1);
  const [notifPage, setNotifPage] = useState(1);
  const [policyPage, setPolicyPage] = useState(1);
  const [assistantFilter, setAssistantFilter] = useState<string>("");

  const assistantsQuery = useAssistants();

  const overview = useRuntimeOverviewQuery();
  const queues = useRuntimeQueuesQuery();
  const consistency = useRuntimeConsistencyQuery();
  const executions = useRuntimeExecutionsQuery({
    page: execPage,
    ...(assistantFilter ? { assistantId: assistantFilter } : {}),
  });
  const browsers = useRuntimeBrowserSessionsQuery(browserPage);
  const notifications = useRuntimeNotificationsFeedQuery(notifPage);
  const policyEvents = useRuntimePolicyEventsQuery(policyPage);

  const assistantOptions = useMemo(() => assistantsQuery.data ?? [], [assistantsQuery.data]);

  const overviewErr =
    overview.error instanceof ApiClientError ? overview.error : overview.error instanceof Error ? overview.error : null;

  if (!runtimeTenantUiEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight text-white">{CABINET_RU.runtimeUx.title}</h1>
        <Card className="border-white/10 bg-[#1a1a1a]">
          <CardHeader>
            <CardTitle className="text-white">{CABINET_RU.runtimeUx.runtimeOff}</CardTitle>
            <CardDescription className="text-white/60">{CABINET_RU.runtimeUx.runtimeOffHint}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const counts = overview.data?.counts;

  return (
    <div
      className={cn(
        search.execution ? "lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6 lg:items-start" : "",
        "space-y-8 lg:space-y-0",
      )}
    >
      <div className="space-y-8">
      <RealtimeConnectionStrip />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">{CABINET_RU.runtimeUx.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-white/60">{CABINET_RU.runtimeUx.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RuntimeUxModeToggle />
          <ProductFeedbackButton defaultCategory="runtime" />
        </div>
      </div>

      <RuntimeOnboardingPanel />
      <BrowserOnboardingHint browserQueuedCount={counts?.browserRunsQueued ?? 0} />

      {consistency.data?.issues.some((i) => i.severity === "critical") ?
        <div
          className="rounded-md border border-red-500/35 bg-red-950/30 px-3 py-2 text-xs text-red-100"
          role="status"
        >
          <span className="font-semibold text-red-50">Runtime consistency — critical</span>
          <span className="ml-2 text-red-100/85">
            Есть критические диагностические сигналы. См. карточку ниже; не отождествлять автоматически с HARD_BLOCK
            overlay исполнения (см. RUNTIME_VISIBILITY_NORMALIZATION.md в репозитории).
          </span>
        </div>
      : null}

      <RuntimeApiErrorCard title="Не удалось загрузить overview" error={overviewErr} />

      {!isRuntimeAdvancedMode() ?
        <section className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            title={CABINET_RU.runtimeUx.runs24h}
            hint="Запуски ассистента в вашей рабочей области"
            value={counts?.aiUsagesLast24h ?? "—"}
            loading={overview.isLoading}
          />
          <MetricCard
            title={CABINET_RU.runtimeUx.realtime}
            value={wsConnected ? CABINET_RU.runtimeUx.online : CABINET_RU.runtimeUx.offline}
            valueClass={wsConnected ? "text-lime-300" : "text-amber-200"}
            loading={overview.isLoading}
          />
          <MetricCard
            title={CABINET_RU.runtimeUx.attention}
            hint="Зависшие задачи браузера и инструментов"
            value={(counts?.stuckBrowserRuns ?? "—") + " / " + (counts?.stuckToolInvocations ?? "—")}
            loading={overview.isLoading}
          />
        </section>
      : null}

      <RuntimeAdvancedGate>
      {queues.data ?
        <Card className="border-white/10 bg-[#1a1a1a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">{CABINET_RU.runtimeUx.queueProjection}</CardTitle>
            <CardDescription className="text-[11px] text-white/45">{CABINET_RU.runtimeUx.queueProjectionNote}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-[11px] text-white/70 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-white/85">Ассистент</div>
              <div className="text-white/55">
                ожидают: {queues.data.buckets.assistant.approximatePendingToolInvocations}
              </div>
              <div className="text-white/45">
                с очередью: {queues.data.buckets.assistant.approximateAiUsagesWithQueueWait}
              </div>
            </div>
            <div>
              <div className="text-white/85">Браузер</div>
              <div className="text-white/55">
                ожидают / выполняются: {queues.data.buckets.browser.queuedRuns} / {queues.data.buckets.browser.runningRuns}
              </div>
            </div>
            <div>
              <div className="text-white/85">Уведомления</div>
              <div className="text-white/55">
                ожидают / в очереди: {queues.data.buckets.notifications.pendingDeliveryTenantWide} /{" "}
                {queues.data.buckets.notifications.queuedDeliveryTenantWide}
              </div>
            </div>
            <div>
              <div className="text-white/85">База знаний</div>
              <div className="text-white/55">
                ожидают / в работе / сбои: {queues.data.buckets.knowledge.documentsPending} /{" "}
                {queues.data.buckets.knowledge.documentsProcessing} / {queues.data.buckets.knowledge.documentsFailed}
              </div>
            </div>
          </CardContent>
        </Card>
      : queues.isLoading ?
        <Card className="border-white/10 bg-[#1a1a1a]">
          <CardContent className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-white/35" aria-hidden />
          </CardContent>
        </Card>
      : null}

      {consistency.data ?
        <Card className="border-white/10 bg-[#1a1a1a]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">{CABINET_RU.runtimeUx.consistencyTitle}</CardTitle>
            <CardDescription className="text-[11px] text-white/45">{CABINET_RU.runtimeUx.consistencyNote}</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[220px] space-y-2 overflow-y-auto text-[11px] text-white/70">
            {consistency.data.issues.length === 0 ?
              <p className="text-white/45">{CABINET_RU.runtimeUx.consistencyEmpty}</p>
            : consistency.data.issues.map((issue) => (
                <div key={issue.code} className="rounded border border-white/10 bg-black/20 p-2">
                  <div className="font-mono text-[10px] text-lime-200/85">{issue.code}</div>
                  <div className="text-white/55">уровень {issue.severity} · повторов {issue.count}</div>
                  {issue.sampleIds.length > 0 ?
                    <div className="truncate text-white/45">примеры: {issue.sampleIds.join(", ")}</div>
                  : null}
                  <div className="text-white/45">{issue.hint}</div>
                </div>
              ))
            }
          </CardContent>
        </Card>
      : consistency.isLoading ?
        <Card className="border-white/10 bg-[#1a1a1a]">
          <CardContent className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-white/35" aria-hidden />
          </CardContent>
        </Card>
      : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={CABINET_RU.runtimeUx.activeExecutions}
          hint="Запущенные браузерные задачи и инструменты"
          value={(counts?.browserRunsRunning ?? "—") + " / " + (counts?.toolInvocationsInFlight ?? "—")}
          loading={overview.isLoading}
        />
        <MetricCard
          title={CABINET_RU.runtimeUx.queue}
          hint={overview.data?.telemetry.queueBacklogTenantScoped === false ? "Глубина очереди — приблизительно" : undefined}
          value={counts?.browserRunsQueued ?? "—"}
          loading={overview.isLoading}
        />
        <MetricCard
          title={CABINET_RU.runtimeUx.browserSessions}
          hint="Активные сессии"
          value={counts?.browserSessionsNonTerminated ?? "—"}
          loading={overview.isLoading}
        />
        <MetricCard
          title={CABINET_RU.runtimeUx.notifications}
          hint="Ожидают доставки и непрочитанные"
          value={counts?.notificationsPendingAttention ?? "—"}
          loading={overview.isLoading}
        />
        <MetricCard
          title={CABINET_RU.runtimeUx.policy}
          hint="События политик и аудит (только чтение)"
          value={policyEvents.data?.total ?? "—"}
          loading={overview.isLoading || policyEvents.isLoading}
        />
        <MetricCard
          title={CABINET_RU.runtimeUx.drift}
          hint="Зависшие инструменты + браузерные задачи"
          value={(counts?.stuckToolInvocations ?? "—") + " · " + (counts?.stuckBrowserRuns ?? "—")}
          loading={overview.isLoading}
        />
        <MetricCard
          title={CABINET_RU.runtimeUx.realtime}
          hint={
            overview.data?.telemetry.realtimeConnectedHint
              ? overview.data.telemetry.realtimeConnectedHint.replace(/_/g, " ")
              : undefined
          }
          value={wsConnected ? CABINET_RU.runtimeUx.online : CABINET_RU.runtimeUx.offline}
          valueClass={wsConnected ? "text-lime-300" : "text-white/40"}
          loading={overview.isLoading}
        />
      </section>

      <Card className="border-white/10 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">{CABINET_RU.runtimeUx.governance}</CardTitle>
          <CardDescription className="text-white/55">{CABINET_RU.runtimeUx.governanceNote}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {GOVERNANCE_ROADMAP_CODES.map((code) => (
              <Badge key={code} variant="outline" className="border-white/15 font-mono text-[10px] text-white/45">
                {code}
              </Badge>
            ))}
          </div>
          <div className="max-h-[320px] overflow-auto rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70">Уровень</TableHead>
                  <TableHead className="text-white/70">Код</TableHead>
                  <TableHead className="text-white/70">Раздел</TableHead>
                  <TableHead className="text-white/70">Когда</TableHead>
                  <TableHead className="text-white/70">Сообщение</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policyEvents.isLoading ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={5} className="py-8 text-center text-white/50">
                      <Loader2 className="mx-auto size-5 animate-spin opacity-70" aria-hidden />
                    </TableCell>
                  </TableRow>
                ) : policyEvents.data?.items.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={5} className="py-6 text-center text-sm text-white/45">
                      {CABINET_RU.runtimeUx.governanceEmpty}
                    </TableCell>
                  </TableRow>
                ) : (
                  policyEvents.data?.items.map((ev) => (
                    <TableRow key={ev.id} className="border-white/10">
                      <TableCell className="font-medium text-white/85">{ev.severity}</TableCell>
                      <TableCell className="font-mono text-xs text-lime-200/90">{ev.code}</TableCell>
                      <TableCell className="text-white/65">{ev.surface}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-white/50">{ev.occurredAt}</TableCell>
                      <TableCell className="max-w-md truncate text-sm text-white/70">{ev.message}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationBar
            page={policyPage}
            total={policyEvents.data?.total ?? 0}
            pageSize={25}
            onPrev={() => setPolicyPage((p) => Math.max(1, p - 1))}
            onNext={() => setPolicyPage((p) => p + 1)}
          />
        </CardContent>
      </Card>
      </RuntimeAdvancedGate>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-[#1a1a1a]">
          <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3 pb-3">
            <div>
              <CardTitle className="text-base text-white">{CABINET_RU.runtimeUx.executions}</CardTitle>
              <CardDescription className="text-white/55">{CABINET_RU.runtimeUx.executionsHint}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="runtime-assistant-filter" className="sr-only">
                Assistant filter
              </label>
              <select
                id="runtime-assistant-filter"
                value={assistantFilter}
                onChange={(e) => {
                  setAssistantFilter(e.target.value);
                  setExecPage(1);
                }}
                className="h-9 rounded-md border border-white/15 bg-black/30 px-2 text-xs text-white outline-none focus:ring-1 focus:ring-lime-400/40"
              >
                <option value="">{CABINET_RU.runtimeUx.allAssistants}</option>
                {assistantOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-[440px] overflow-auto rounded-md border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/70">Запуск</TableHead>
                    <TableHead className="text-white/70">Ассистент</TableHead>
                    <TableHead className="text-white/70">Статус</TableHead>
                    <TableHead className="text-white/70">Раздел</TableHead>
                    <TableHead className="text-white/70">Начало</TableHead>
                    <TableHead className="text-white/70">Длительность</TableHead>
                    <TableHead className="text-white/70">Политика</TableHead>
                    <TableHead className="text-white/70">Браузер</TableHead>
                    <TableHead className="text-white/70">Повтор</TableHead>
                    <TableHead className="text-white/70">Оверлей</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.isLoading ? (
                    <TableRow className="border-white/10">
                      <TableCell colSpan={10} className="py-8 text-center text-white/50">
                        <Loader2 className="mx-auto size-5 animate-spin opacity-70" aria-hidden />
                      </TableCell>
                    </TableRow>
                  ) : executions.data?.items.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell colSpan={10} className="py-10 text-center">
                        <p className="text-sm text-white/70">{CABINET_RU.runtimeUx.noExecutions}</p>
                        <p className="mx-auto mt-1 max-w-md text-xs text-white/45">
                          {CABINET_RU.runtimeUx.noExecutionsHelp}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    executions.data?.items.map((row) => (
                      <TableRow
                        key={row.usageRowId}
                        className={cn(
                          "cursor-pointer border-white/10 hover:bg-white/[0.03]",
                          search.execution === row.executionId && "bg-lime-500/[0.07]",
                        )}
                        onClick={() =>
                          navigate({
                            search: { execution: row.executionId },
                            replace: false,
                          })
                        }
                      >
                        <TableCell className="font-mono text-xs text-lime-200/90">{row.executionId.slice(0, 10)}…</TableCell>
                        <TableCell className="max-w-[140px] truncate text-sm text-white/75">
                          {row.assistantName ?? row.assistantId ?? "—"}
                        </TableCell>
                        <TableCell className="text-white/75">{row.status}</TableCell>
                        <TableCell className="text-white/65">{row.surface}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-white/50">{row.startedAt}</TableCell>
                        <TableCell className="text-white/65">{formatDurationMs(row.durationMs)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px]", policyBadgeVariant(row.policyDecision))}>
                            {row.policyDecision ?? "UNKNOWN"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/65">{row.browserLinked ? "да" : "—"}</TableCell>
                        <TableCell className="text-white/65">{row.replayLikely ? "вероятно" : "—"}</TableCell>
                        <TableCell>
                          {row.dominantOverlay ?
                            <Badge variant="outline" className="border-fuchsia-500/40 font-mono text-[9px] text-fuchsia-100">
                              {row.dominantOverlay.replace(/_/g, " ")}
                            </Badge>
                          : <span className="text-white/35">—</span>}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <PaginationBar
              page={execPage}
              total={executions.data?.total ?? 0}
              pageSize={20}
              onPrev={() => setExecPage((p) => Math.max(1, p - 1))}
              onNext={() => setExecPage((p) => p + 1)}
            />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#1a1a1a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">{CABINET_RU.runtimeUx.browserSessions}</CardTitle>
            <CardDescription className="text-white/55">Активные браузерные сессии вашей рабочей области.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-[440px] overflow-auto rounded-md border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/70">Сессия</TableHead>
                    <TableHead className="text-white/70">Статус</TableHead>
                    <TableHead className="text-white/70">Режим</TableHead>
                    <TableHead className="text-white/70">Активных</TableHead>
                    <TableHead className="text-white/70">Обновлено</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {browsers.isLoading ? (
                    <TableRow className="border-white/10">
                      <TableCell colSpan={5} className="py-8 text-center text-white/50">
                        <Loader2 className="mx-auto size-5 animate-spin opacity-70" aria-hidden />
                      </TableCell>
                    </TableRow>
                  ) : (
                    browsers.data?.items.map((s) => (
                      <TableRow key={s.id} className="border-white/10">
                        <TableCell className="font-mono text-xs text-white/80">{s.id.slice(0, 12)}…</TableCell>
                        <TableCell className="text-white/70">{s.status}</TableCell>
                        <TableCell className="text-white/65">{s.operatorMode}</TableCell>
                        <TableCell className="text-white/65">{s.activeRuns}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-white/45">{s.updatedAt}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <PaginationBar
              page={browserPage}
              total={browsers.data?.total ?? 0}
              pageSize={15}
              onPrev={() => setBrowserPage((p) => Math.max(1, p - 1))}
              onNext={() => setBrowserPage((p) => p + 1)}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">{CABINET_RU.runtimeUx.notifications}</CardTitle>
          <CardDescription className="text-white/55">Ваши персональные уведомления в рабочей области.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-h-[280px] overflow-auto rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70">Тип</TableHead>
                  <TableHead className="text-white/70">Заголовок</TableHead>
                  <TableHead className="text-white/70">Доставка</TableHead>
                  <TableHead className="text-white/70">Создано</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.isLoading ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={4} className="py-8 text-center text-white/50">
                      <Loader2 className="mx-auto size-5 animate-spin opacity-70" aria-hidden />
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.data?.items.map((n) => (
                    <TableRow key={n.id} className="border-white/10">
                      <TableCell className="font-mono text-xs text-white/75">{n.kind}</TableCell>
                      <TableCell className="max-w-md truncate text-sm text-white/80">{n.title}</TableCell>
                      <TableCell className="text-white/60">{n.deliveryState}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-white/45">{n.createdAt}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationBar
            page={notifPage}
            total={notifications.data?.total ?? 0}
            pageSize={15}
            onPrev={() => setNotifPage((p) => Math.max(1, p - 1))}
            onNext={() => setNotifPage((p) => p + 1)}
          />
        </CardContent>
      </Card>

      </div>

      {search.execution ?
        <ExecutionInspector
          executionId={search.execution}
          onClose={() =>
            navigate({
              replace: true,
              search: () => ({}),
            })
          }
        />
      : null}
    </div>
  );
}

function MetricCard(props: {
  title: string;
  value: string | number;
  subtitle?: string;
  hint?: string;
  loading?: boolean;
  valueClass?: string;
}) {
  return (
    <Card className="border-white/10 bg-[#1a1a1a]">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-white/45">{props.title}</CardTitle>
        {props.hint ? <CardDescription className="text-[11px] text-white/35">{props.hint}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {props.loading ? (
          <Loader2 className="size-5 animate-spin text-white/30" aria-hidden />
        ) : (
          <>
            <div className={cn("text-2xl font-semibold text-white", props.valueClass)}>{props.value}</div>
            {props.subtitle ? <p className="mt-1 text-xs text-white/40">{props.subtitle}</p> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PaginationBar(props: {
  page: number;
  total: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const totalPages = Math.max(1, Math.ceil(props.total / props.pageSize));
  const canNext = props.page * props.pageSize < props.total;

  return (
    <div className="flex items-center justify-between gap-3 text-xs text-white/50">
      <span>
        Страница {props.page} / {totalPages} · всего {props.total}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-white/15 bg-transparent text-white/80 hover:bg-white/5"
          disabled={props.page <= 1}
          onClick={props.onPrev}
        >
          Назад
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-white/15 bg-transparent text-white/80 hover:bg-white/5"
          disabled={!canNext}
          onClick={props.onNext}
        >
          Далее
        </Button>
      </div>
    </div>
  );
}
