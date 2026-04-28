/**
 * /app/analytics — расширенная аналитика с графиками recharts.
 */
import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/app/page-header";
import { useActivity30d, useDashboardKpis } from "@/lib/hooks/use-app";
import { cn } from "@/lib/utils";
import type { DashboardKpi } from "@/types/entities";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [{ title: "Аналитика — botme" }],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: kpis } = useDashboardKpis();
  const { data: activity, isLoading } = useActivity30d();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Аналитика"
        description="Глубокая статистика по диалогам, лидам и каналам."
      />

      {/* KPI tiles */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(kpis ?? []).map((kpi) => (
          <KpiTile key={kpi.label} kpi={kpi} />
        ))}
      </section>

      {/* Activity chart */}
      <section className="rounded-xl border border-border bg-background p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Сообщения и лиды за 30 дней
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Динамика входящих сообщений и квалифицированных лидов.
        </p>
        <div className="mt-5 h-[300px] w-full">
          {isLoading ? (
            <div className="h-full animate-pulse rounded-lg bg-surface-muted" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activity ?? []}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="aMsg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aLead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="var(--ink-subtle)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) =>
                    new Date(v).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })
                  }
                  minTickGap={24}
                />
                <YAxis
                  stroke="var(--ink-subtle)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
                  contentStyle={{
                    background: "var(--background)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 8,
                    fontSize: 12,
                    padding: "8px 10px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="var(--foreground)"
                  strokeWidth={2}
                  fill="url(#aMsg)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#aLead)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Channel split */}
      <section className="rounded-xl border border-border bg-background p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Распределение по каналам
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Откуда приходят лиды — за последние 30 дней.
        </p>
        <div className="mt-5 h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { channel: "Telegram", leads: 142 },
                { channel: "Сайт", leads: 96 },
                { channel: "Avito", leads: 68 },
                { channel: "ВКонтакте", leads: 31 },
                { channel: "WhatsApp", leads: 22 },
              ]}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="channel"
                stroke="var(--ink-subtle)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--ink-subtle)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                cursor={{ fill: "var(--surface-muted)" }}
                contentStyle={{
                  background: "var(--background)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: 8,
                  fontSize: 12,
                  padding: "8px 10px",
                }}
              />
              <Bar
                dataKey="leads"
                fill="var(--foreground)"
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function KpiTile({ kpi }: { kpi: DashboardKpi }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
        {kpi.label}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <div className="font-display text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {kpi.value}
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
            kpi.trend.positive
              ? "bg-accent text-accent-ink"
              : "bg-surface-muted text-ink-muted",
          )}
        >
          {kpi.trend.delta}
        </span>
      </div>
      {kpi.hint ? <div className="mt-2 text-xs text-ink-subtle">{kpi.hint}</div> : null}
    </div>
  );
}
