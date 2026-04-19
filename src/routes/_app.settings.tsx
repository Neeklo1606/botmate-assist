/**
 * /app/settings — настройки workspace + usage.
 */
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/lib/hooks/use-auth";
import { useUsage } from "@/lib/hooks/use-app";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: user } = useCurrentUser();
  const { data: usage } = useUsage();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Настройки"
        description="Профиль, workspace, тариф и интеграции."
      />

      {/* Profile */}
      <section className="rounded-xl border border-border bg-background p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Профиль</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Эти данные видят коллеги в команде.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input id="name" defaultValue={user?.name ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={user?.email ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws">Workspace</Label>
            <Input id="ws" defaultValue={user?.workspaceName ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Telegram</Label>
            <Input id="username" defaultValue={user ? `@${user.username}` : ""} />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="brand" size="md">Сохранить</Button>
        </div>
      </section>

      {/* Plan */}
      <section className="rounded-xl border border-border bg-background p-5 md:p-6">
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Тариф</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Текущий план: <span className="font-medium text-foreground">Рост</span> · 12 900 ₽/мес
            </p>
          </div>
          <Button variant="outline" size="md">Сменить тариф</Button>
        </div>

        {usage ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <UsageCard label="Сообщения" used={usage.messages.used} limit={usage.messages.limit} />
            <UsageCard label="Ассистенты" used={usage.assistants.used} limit={usage.assistants.limit} />
            <UsageCard label="Каналы" used={usage.channels.used} limit={usage.channels.limit} />
            <UsageCard label="База знаний, MB" used={usage.knowledgeMb.used} limit={usage.knowledgeMb.limit} />
          </div>
        ) : null}
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-destructive/30 bg-background p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Опасная зона</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Удаление workspace необратимо. Все ассистенты, лиды и интеграции будут удалены.
        </p>
        <div className="mt-4">
          <Button variant="outline" size="md" className="border-destructive/40 text-destructive hover:bg-destructive/10">
            Удалить workspace
          </Button>
        </div>
      </section>
    </div>
  );
}

function UsageCard({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const warn = pct >= 80;
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5 tabular-nums">
        <span className="font-display text-xl font-semibold text-foreground">
          {used.toLocaleString("ru-RU")}
        </span>
        <span className="text-sm text-ink-muted">
          / {limit.toLocaleString("ru-RU")}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            warn ? "bg-destructive" : "bg-foreground",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
