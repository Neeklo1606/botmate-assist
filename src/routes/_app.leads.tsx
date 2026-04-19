/**
 * /app/leads — таблица всех лидов с фильтром по статусу.
 */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Inbox, Download, Search } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChannelIcon } from "@/components/brand/channel-icon";
import { useLeads } from "@/lib/hooks/use-app";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/entities";

export const Route = createFileRoute("/_app/leads")({
  component: LeadsPage,
});

const FILTERS: { id: "all" | LeadStatus; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "new", label: "Новые" },
  { id: "qualified", label: "Квалифицированы" },
  { id: "won", label: "Сделки" },
  { id: "lost", label: "Слив" },
];

function LeadsPage() {
  const { data: leads, isLoading } = useLeads();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");

  const filtered = (leads ?? []).filter((l) => {
    if (filter !== "all" && l.status !== filter) return false;
    if (query && !`${l.contact} ${l.summary}`.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Лиды"
        description="Все обращения, которые квалифицировали ассистенты."
        actions={
          <Button variant="outline" size="md">
            <Download className="h-4 w-4" />
            Экспорт
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.id
                  ? "bg-foreground text-background"
                  : "bg-surface-muted text-ink-muted hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
            strokeWidth={1.75}
          />
          <Input
            placeholder="Поиск по контакту или тексту"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-px rounded-xl border border-border bg-background">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[68px] animate-pulse bg-surface-muted/40" />
          ))}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" strokeWidth={1.75} />}
          title="Лидов пока нет"
          description="По выбранному фильтру ничего не найдено."
        />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-background">
          {filtered.map((lead) => (
            <LeadRow key={lead.id} lead={lead} />
          ))}
        </ul>
      )}
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  return (
    <li className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-muted/60 md:px-6">
      <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md bg-surface-muted">
        <ChannelIcon id={lead.channel} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-foreground">{lead.contact}</span>
          <LeadStatusBadge status={lead.status} />
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{lead.summary}</p>
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
  );
}

function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const map = {
    new: { label: "Новый", cls: "bg-surface-muted text-ink-muted" },
    qualified: { label: "Квалифицирован", cls: "bg-accent text-accent-ink" },
    won: { label: "Сделка", cls: "bg-foreground text-background" },
    lost: { label: "Слив", cls: "bg-surface-muted text-ink-muted line-through" },
  } as const;
  const m = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        m.cls,
      )}
    >
      {m.label}
    </span>
  );
}
