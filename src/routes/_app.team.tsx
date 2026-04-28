/**
 * /app/team — управление командой workspace.
 */
import { createFileRoute } from "@tanstack/react-router";
import { UserPlus, MoreHorizontal, Users2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { useTeamList } from "@/lib/hooks/use-app";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/types/entities";

export const Route = createFileRoute("/_app/team")({
  head: () => ({
    meta: [{ title: "Команда — botme" }],
  }),
  component: TeamPage,
});

const ROLE_LABEL: Record<TeamMember["role"], string> = {
  owner: "Владелец",
  admin: "Администратор",
  editor: "Редактор",
  viewer: "Наблюдатель",
};

function TeamPage() {
  const { data: members, isLoading } = useTeamList();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Команда"
        description="Кто имеет доступ к workspace и какие у них права."
        actions={
          <Button variant="brand" size="md">
            <UserPlus className="h-4 w-4" />
            Пригласить
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-xl border border-border bg-background" />
          ))}
        </div>
      ) : !members?.length ? (
        <EmptyState
          icon={<Users2 className="h-5 w-5" strokeWidth={1.75} />}
          title="Команда пока из вас одного"
          description="Пригласите коллег, чтобы вместе вести ассистентов."
          action={<Button variant="brand" size="sm">Пригласить</Button>}
        />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-background">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-muted/60 md:px-6"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                {m.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium text-foreground">{m.name}</span>
                  {m.status === "pending" ? (
                    <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                      Ожидает приглашения
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 text-sm text-ink-muted">{m.email}</div>
              </div>
              <span
                className={cn(
                  "hidden rounded-full px-2 py-1 text-xs font-medium md:inline-flex",
                  m.role === "owner"
                    ? "bg-foreground text-background"
                    : "bg-surface-muted text-ink-muted",
                )}
              >
                {ROLE_LABEL[m.role]}
              </span>
              <Button variant="ghostInk" size="icon" aria-label="Меню">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
