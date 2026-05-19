/**
 * `/runtime/compare` — readonly execution diff (additive).
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactElement } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useExecutionGraphQuery,
  useReplayVisibilityMatrixQuery,
  useRuntimeExecutionDetailQuery,
} from "@/lib/hooks/use-runtime-queries";
import { runtimeTenantUiEnabled, runtimeWorkspaceUiEnabled } from "@/lib/runtime/config";
import { useProductPageView } from "@/lib/hooks/use-product-page-view";
import { RealtimeConnectionStrip } from "@/components/runtime/realtime-connection-strip";
import { FeatureMaturityBadge } from "@/components/product/feature-maturity-badge";
import { RUNTIME_SURFACE_MATURITY } from "@/lib/product/feature-maturity";

interface CompareSearch {
  a?: string;
  b?: string;
}

export const Route = createFileRoute("/_app/runtime/compare")({
  validateSearch: (search: Record<string, unknown>): CompareSearch => ({
    a: typeof search.a === "string" && search.a.trim() ? search.a.trim() : undefined,
    b: typeof search.b === "string" && search.b.trim() ? search.b.trim() : undefined,
  }),
  head: () => ({ meta: [{ title: "Сравнение запусков — botme" }] }),
  component: RuntimeCompareRoute,
});

function RuntimeCompareRoute(): ReactElement {
  useProductPageView({
    sessionKey: "runtime-compare",
    event: "activation.compare_opened",
    milestoneSuffix: "compare_opened",
    enabled: runtimeTenantUiEnabled() && runtimeWorkspaceUiEnabled(),
  });

  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [draftA, setDraftA] = useState(search.a ?? "");
  const [draftB, setDraftB] = useState(search.b ?? "");

  const detailA = useRuntimeExecutionDetailQuery(search.a ?? null);
  const detailB = useRuntimeExecutionDetailQuery(search.b ?? null);
  const replayA = useReplayVisibilityMatrixQuery(search.a);
  const replayB = useReplayVisibilityMatrixQuery(search.b);
  const graphA = useExecutionGraphQuery(search.a);
  const graphB = useExecutionGraphQuery(search.b);

  const rows = useMemo(
    () =>
      [
        {
          label: "Решение политики",
          left: detailA.data?.execution.policyDecision ?? "—",
          right: detailB.data?.execution.policyDecision ?? "—",
        },
        {
          label: "Статус",
          left: detailA.data?.execution.status ?? "—",
          right: detailB.data?.execution.status ?? "—",
        },
        {
          label: "Раздел",
          left: detailA.data?.execution.surface ?? "—",
          right: detailB.data?.execution.surface ?? "—",
        },
        {
          label: "Связан с браузером",
          left: detailA.data?.execution.browserLinked ? "да" : "нет",
          right: detailB.data?.execution.browserLinked ? "да" : "нет",
        },
        {
          label: "Уровень повтора",
          left: replayA.data?.tier ?? "—",
          right: replayB.data?.tier ?? "—",
        },
        {
          label: "Возможен повтор",
          left: replayA.data?.replayLikely ? "да" : "нет",
          right: replayB.data?.replayLikely ? "да" : "нет",
        },
        {
          label: "Узлов / связей",
          left:
            graphA.data ? `${graphA.data.nodes.length} / ${graphA.data.edges.length}` : graphA.isLoading ? "…" : "—",
          right:
            graphB.data ? `${graphB.data.nodes.length} / ${graphB.data.edges.length}` : graphB.isLoading ? "…" : "—",
        },
        {
          label: "Браузерных запусков",
          left: detailA.data ? String(detailA.data.browserRuns.length) : "—",
          right: detailB.data ? String(detailB.data.browserRuns.length) : "—",
        },
      ] as const,
    [
      detailA.data,
      detailB.data,
      graphA.data,
      graphA.isLoading,
      graphB.data,
      graphB.isLoading,
      replayA.data?.replayLikely,
      replayA.data?.tier,
      replayB.data?.replayLikely,
      replayB.data?.tier,
    ],
  );

  function apply(): void {
    void navigate({
      search: {
        ...(draftA.trim() ? { a: draftA.trim() } : {}),
        ...(draftB.trim() ? { b: draftB.trim() } : {}),
      },
      replace: true,
    });
  }

  if (!runtimeTenantUiEnabled() || !runtimeWorkspaceUiEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-white">Сравнение запусков</h1>
        <p className="text-sm text-white/60">
          Раздел доступен на тарифе «Про». Сравнение двух запусков ассистента
          бок-о-бок — для отладки политик и оверлеев.
        </p>
      </div>
    );
  }

  const loadingPair =
    (Boolean(search.a) && detailA.isLoading) || (Boolean(search.b) && detailB.isLoading) ? true : false;

  return (
    <div className="space-y-6">
      <RealtimeConnectionStrip />
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-white">Сравнение запусков</h1>
          <FeatureMaturityBadge maturity={RUNTIME_SURFACE_MATURITY.compare} />
        </div>
        <p className="max-w-3xl text-sm text-white/60">
          Сравнение двух запусков ассистента бок-о-бок — для отладки политик и
          расхождений. Только чтение.
        </p>
      </header>

      <Card className="border-white/10 bg-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white">Выбор запусков</CardTitle>
          <CardDescription className="text-[11px] text-white/45">Укажите идентификаторы запусков из вашей рабочей области.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[11px] text-white/55">
            Запуск A
            <Input
              value={draftA}
              onChange={(e) => setDraftA(e.target.value)}
              className="min-w-[240px] border-white/15 bg-black/40 font-mono text-xs text-white"
              placeholder="id запуска"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-white/55">
            Запуск B
            <Input
              value={draftB}
              onChange={(e) => setDraftB(e.target.value)}
              className="min-w-[240px] border-white/15 bg-black/40 font-mono text-xs text-white"
              placeholder="id запуска"
            />
          </label>
          <Button
            type="button"
            className="bg-lime-500 text-black hover:bg-lime-400"
            onClick={() => apply()}
          >
            Применить
          </Button>
        </CardContent>
      </Card>

      {loadingPair ?
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/35" aria-hidden />
        </div>
      : <div className="grid gap-4 lg:grid-cols-2">
          <SummaryColumn title="Запуск A" id={search.a} detail={detailA} replay={replayA} />
          <SummaryColumn title="Запуск B" id={search.b} detail={detailB} replay={replayB} />
        </div>
      }

      <Card className="border-white/10 bg-[#1a1a1a]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Различия по полям</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px] text-white/70">
            <thead>
              <tr className="border-b border-white/10 text-white/45">
                <th className="py-2 pr-3">Поле</th>
                <th className="py-2 pr-3">A</th>
                <th className="py-2 pr-3">B</th>
                <th className="w-16 py-2">Δ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-white/5">
                  <td className="py-2 pr-3 text-white/55">{row.label}</td>
                  <td className="py-2 pr-3 font-mono text-[10px] text-lime-200/85">{row.left}</td>
                  <td className="py-2 font-mono text-[10px] text-white/75">{row.right}</td>
                  <td className="py-2 pl-2">
                    {row.left !== row.right ?
                      <Badge variant="outline" className="border-amber-400/40 text-[9px] text-amber-100">
                        отличается
                      </Badge>
                    : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryColumn(props: {
  title: string;
  id?: string;
  detail: ReturnType<typeof useRuntimeExecutionDetailQuery>;
  replay: ReturnType<typeof useReplayVisibilityMatrixQuery>;
}): ReactElement {
  return (
    <Card className="border-white/10 bg-[#1a1a1a]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white">{props.title}</CardTitle>
        <CardDescription className="font-mono text-[10px] text-white/45">{props.id ?? "—"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-[11px] text-white/70">
        {!props.id ?
          <p className="text-white/35">Не задан идентификатор.</p>
        : props.detail.isLoading ?
          <Loader2 className="size-5 animate-spin text-white/30" aria-hidden />
        : props.detail.data ?
          <ul className="space-y-1">
            <li>ассистент · {props.detail.data.execution.assistantName ?? props.detail.data.execution.assistantId}</li>
            <li>политика · {props.detail.data.execution.policyDecision ?? "неизвестно"}</li>
            <li>причины повтора (топ 4)</li>
            <ul className="list-inside list-disc pl-3 text-white/55">
              {(props.replay.data?.reasons ?? []).slice(0, 4).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </ul>
        : <p className="text-white/35">Нет данных — проверьте идентификатор.</p>}
      </CardContent>
    </Card>
  );
}
