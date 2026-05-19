/**
 * /app/assistants — список ассистентов кабинета.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Bot, MoreHorizontal, Pause, Play } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { ChannelIcon } from "@/components/brand/channel-icon";
import { useAssistants } from "@/lib/hooks/use-app";
import { cn } from "@/lib/utils";
import type { Assistant } from "@/types/entities";

export const Route = createFileRoute("/_app/assistants")({
  head: () => ({
    meta: [{ title: "Ассистенты — botme" }],
  }),
  component: AssistantsPage,
});

const NICHE_LABEL: Record<string, string> = {
  real_estate: "Недвижимость",
  auto: "Авто",
  clinic: "Клиники",
  online_school: "Онлайн-школы",
  services: "Услуги",
  agency: "Агентства",
  other: "Другое",
};

function AssistantsPage() {
  const { data: assistants, isLoading } = useAssistants();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ассистенты"
        description="Управляйте AI-сотрудниками: каналы, сценарии, статус."
        actions={
          <Button variant="brand" size="md">
            <Plus className="h-4 w-4" />
            Новый ассистент
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[88px] animate-pulse rounded-xl border border-border bg-background" />
          ))}
        </div>
      ) : !assistants?.length ? (
        <EmptyState
          icon={<Bot className="h-5 w-5" strokeWidth={1.75} />}
          title="Пока нет ассистентов"
          description="Создайте первого — настроим под ваш бизнес за 3 дня."
          action={
            <Button variant="brand" size="sm">
              Создать ассистента
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {assistants.map((a) => (
            <AssistantRow key={a.id} a={a} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AssistantRow({ a }: { a: Assistant }) {
  const isActive = a.status === "active";
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-display text-base font-semibold text-foreground">
            {a.name}
          </span>
          <StatusBadge status={a.status} />
        </div>
        <div className="mt-1 text-sm text-ink-muted">
          {NICHE_LABEL[a.niche] ?? a.niche}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-subtle">
          <div className="flex items-center gap-1.5">
            {a.channels.map((c) => (
              <span
                key={c}
                className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-muted"
              >
                <ChannelIcon id={c} className="h-3.5 w-3.5" />
              </span>
            ))}
          </div>
          <span>·</span>
          <span className="tabular-nums">
            {a.conversations7d.toLocaleString("ru-RU")} диалогов / 7 дней
          </span>
          <span>·</span>
          <span className="tabular-nums">{a.leads7d} лидов</span>
          <span>·</span>
          <span className="tabular-nums">
            конверсия {Math.round(a.conversion * 100)}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghostInk" size="sm">
          {isActive ? (
            <>
              <Pause className="h-4 w-4" />
              Пауза
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Запустить
            </>
          )}
        </Button>
        <Button variant="outline" size="sm">
          Открыть
        </Button>
        <Button variant="ghostInk" size="icon" aria-label="Меню">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: Assistant["status"] }) {
  const map = {
    active: { label: "Активен", cls: "bg-accent text-accent-ink" },
    paused: { label: "На паузе", cls: "bg-surface-muted text-ink-muted" },
    draft: { label: "Черновик", cls: "bg-surface-muted text-ink-muted" },
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
