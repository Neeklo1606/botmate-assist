/**
 * /app — Dashboard.
 * KPI-плитки + график активности 30 дней (recharts) + последние лиды.
 * Recharts — только здесь, в кабинете. На лендинге не используем.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Plus, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { useActivity30d, useDashboardKpis, useLeads } from "@/lib/hooks/use-app";
import { useCurrentUser } from "@/lib/hooks/use-auth";
import { ChannelIcon } from "@/components/brand/channel-icon";
import { cn } from "@/lib/utils";
import type { DashboardKpi, SparkPoint } from "@/types/entities";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: kpis, isLoading: kpisLoading } = useDashboardKpis();
  const { data: activity, isLoading: actLoading } = useActivity30d();
  const { data: leads, isLoading: leadsLoading } = useLeads();

  const greeting = user?.name?.split(" ")[0] ?? "Здравствуйте";

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Привет, ${greeting}`}
        description="Что произошло в ваших ассистентах за последние 7 дней"
        actions={
          <Button variant="brand" size="md">
            <Plus className="h-4 w-4" />
            Новый ассистент
          </Button>
        }
      />

      {/* KPI grid */}
      <section aria-label="Ключевые метрики">
        {kpisLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <KpiSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis?.map((kpi) => <KpiCard key={kpi.label} kpi={kpi} />)}
          </div>
        )}
      </section>

      {/* Activity chart */}
      <section
        aria-label="Активность за 30 дней"
        className="rounded-xl border border-border bg-background p-5 md:p-6"
      >
        <div className="mb-4 flex flex-col items-start justify-between gap-2 md:flex-row md:items-end">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Активность 30 дней
            </h2>
            <p className="text-sm text-ink-muted">
              Сообщения и квалифицированные лиды по дням
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            <LegendDot color="bg-foreground" label="Сообщения" />
            <LegendDot color="bg-accent" label="Лиды" />
          </div>
        </div>
        {actLoading ? (
          <div className="h-[260px] animate-pulse rounded-lg bg-surface-muted" />
        ) : (
          <ActivityChart data={activity ?? []} />
        )}
      </section>

      {/* Recent leads */}
      <section
        aria-label="Последние лиды"
        className="rounded-xl border border-border bg-background"
      >
        <div className="flex items-center justify-between border-b border-border p-5 md:px-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Свежие лиды
            </h2>
            <p className="text-sm text-ink-muted">Что упало в воронку за последние часы</p>
          </div>
          <Button variant="ghostInk" size="sm" asChild>
            <Link to="/app">Все лиды →</Link>
          </Button>
        </div>
        {leadsLoading ? (
          <div className="space-y-px">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[68px] animate-pulse bg-surface-muted/40" />
            ))}
          </div>
        ) : !leads?.length ? (
          <div className="p-6">
            <EmptyState
              icon={<MessageSquare className="h-5 w-5" strokeWidth={1.75} />}
              title="Пока нет лидов"
              description="Как только ассистент квалифицирует первого клиента — он появится здесь."
              action={
                <Button variant="brand" size="sm">
                  Создать ассистента
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {leads.map((lead) => (
              <li
                key={lead.id}
                className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-muted/60 md:px-6"
              >
                <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md bg-surface-muted">
                  <ChannelIcon id={lead.channel} className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-foreground">{lead.contact}</span>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-sm text-ink-muted">
                    {lead.summary}
                  </p>
                </div>
                <time className="hidden flex-none text-xs text-ink-subtle md:block">
                  {new Date(lead.createdAt).toLocaleString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "short",
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ───── Building blocks ───── */

function KpiSkeleton() {
  return (
    <div className="h-[140px] animate-pulse rounded-xl border border-border bg-background" />
  );
}

function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const TrendIcon = kpi.trend.positive ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
        {kpi.label}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <div className="font-display text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {kpi.value}
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
            kpi.trend.positive
              ? "bg-accent text-accent-ink"
              : "bg-surface-muted text-ink-muted",
          )}
        >
          <TrendIcon className="h-3 w-3" strokeWidth={2} />
          {kpi.trend.delta}
        </div>
      </div>
      <div className="mt-3 h-[36px]">
        <Sparkline data={kpi.spark} positive={kpi.trend.positive} />
      </div>
      {kpi.hint ? (
        <div className="mt-2 text-xs text-ink-subtle">{kpi.hint}</div>
      ) : null}
    </div>
  );
}

function Sparkline({ data, positive }: { data: SparkPoint[]; positive: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="y"
          stroke={positive ? "var(--accent)" : "var(--ink-subtle)"}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ActivityChart({ data }: { data: { date: string; messages: number; leads: number }[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="msgFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
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
            labelStyle={{ color: "var(--ink-muted)", marginBottom: 4 }}
            labelFormatter={(v) =>
              new Date(v).toLocaleDateString("ru-RU", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })
            }
            formatter={(value, name) => [
              typeof value === "number" ? value.toLocaleString("ru-RU") : String(value),
              name === "messages" ? "Сообщения" : "Лиды",
            ]}
          />
          <Area
            type="monotone"
            dataKey="messages"
            stroke="var(--foreground)"
            strokeWidth={2}
            fill="url(#msgFill)"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="leads"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#leadFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label}
    </span>
  );
}

function LeadStatusBadge({ status }: { status: "new" | "qualified" | "won" | "lost" }) {
  const map = {
    new: { label: "Новый", cls: "bg-surface-muted text-ink-muted" },
    qualified: { label: "Квалифицирован", cls: "bg-accent text-accent-ink" },
    won: { label: "Сделка", cls: "bg-foreground text-background" },
    lost: { label: "Слив", cls: "bg-surface-muted text-ink-muted line-through" },
  } as const;
  const meta = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        meta.cls,
      )}
    >
      {meta.label}
    </span>
  );
}
