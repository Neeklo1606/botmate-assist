/**
 * /settings — центр настроек пользователя.
 *
 * Логика: личный профиль и предпочтения здесь; всё, что относится
 * к рабочей области (тариф, команда, биллинг, интеграции, API,
 * безопасность, поддержка), живёт в `/workspace`. Это убирает
 * дублирование и делает структуру предсказуемой.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  KeyRound,
  LogOut,
  Mail,
  Plug,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { useCurrentUser, useLogout } from "@/lib/auth";
import { CABINET_RU } from "@/lib/i18n/cabinet-ru";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Настройки — botme" }] }),
  component: SettingsPage,
});

const PLAN_LABEL: Record<string, string> = {
  start: "Старт",
  growth: "Про",
  scale: "Корпоративный",
};

const ROLE_LABEL: Record<string, string> = {
  owner: "Владелец",
  admin: "Администратор",
  editor: "Оператор",
};

type WorkspaceTab = "overview" | "team" | "integrations" | "onboarding" | "support";

interface ShortcutItem {
  to: string;
  search?: { tab: WorkspaceTab };
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
}

const WORKSPACE_SHORTCUTS: ShortcutItem[] = [
  {
    to: "/workspace",
    search: { tab: "overview" },
    icon: Wallet,
    title: "Тариф и лимиты",
    description: "Текущий план, использование и обновление тарифа.",
  },
  {
    to: "/workspace",
    search: { tab: "team" },
    icon: Users,
    title: "Команда",
    description: "Участники, роли и приглашения.",
  },
  {
    to: "/workspace",
    search: { tab: "integrations" },
    icon: Plug,
    title: "Интеграции",
    description: "Подключение OpenAI, виджет и другие каналы.",
  },
  {
    to: "/api-keys",
    icon: KeyRound,
    title: "API-ключи",
    description: "Программный доступ к данным рабочей области.",
  },
  {
    to: "/audit",
    icon: ShieldCheck,
    title: "Безопасность и аудит",
    description: "Журнал действий и события безопасности.",
  },
  {
    to: "/workspace",
    search: { tab: "support" },
    icon: Building2,
    title: "Поддержка и диагностика",
    description: "Состояние сервиса и контакты поддержки.",
  },
];

function SettingsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const logoutMut = useLogout();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="py-12 text-sm text-white/55">{CABINET_RU.common.loading}</div>
    );
  }

  if (!user) {
    return (
      <div className="py-12 text-sm text-white/55">
        Не удалось получить данные пользователя. Попробуйте обновить страницу.
      </div>
    );
  }

  const planLabel = PLAN_LABEL[user.plan] ?? user.plan;
  const roleLabel = ROLE_LABEL[user.role] ?? user.role;

  const handleLogout = () => {
    logoutMut.mutate(undefined, {
      onSuccess: () => {
        toast.success("Вы вышли из аккаунта");
        navigate({ to: "/" });
      },
      onError: () => toast.error("Не удалось выйти, попробуйте ещё раз"),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Настройки"
        description="Личный профиль и быстрые переходы к настройкам рабочей области."
      />

      <section
        className="rounded-xl p-5"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
      >
        <div className="flex flex-wrap items-start gap-4">
          <span
            className="flex h-14 w-14 flex-none items-center justify-center rounded-full text-base font-semibold"
            style={{ background: "#a8ff57", color: "#0a0a0a" }}
            aria-hidden
          >
            {user.avatarInitials}
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">{user.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {user.email}
                </span>
                <span className="text-white/30">·</span>
                <span>{roleLabel}</span>
                <span className="text-white/30">·</span>
                <span>Тариф: {planLabel}</span>
              </div>
            </div>
            <ProfileFieldGrid
              rows={[
                { label: "Имя", value: user.name },
                { label: "Email", value: user.email },
                { label: "Рабочая область", value: user.workspaceName },
                { label: "Роль", value: roleLabel },
              ]}
            />
            <p className="text-xs text-white/45">
              Чтобы изменить имя или email, напишите в поддержку — в этом разделе скоро появится
              самостоятельное редактирование профиля.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold text-white">Рабочая область</h2>
        <p className="text-sm text-white/55">
          Настройки тарифа, команды, интеграций, API и безопасности находятся в едином разделе{" "}
          «Рабочая область».
        </p>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {WORKSPACE_SHORTCUTS.map((item) => (
            <li key={`${item.to}:${item.search?.tab ?? ""}`}>
              <Link
                to={item.to}
                {...(item.search ? { search: item.search } : {})}
                className="group flex h-full items-start gap-3 rounded-xl p-4 transition-colors"
                style={{ background: "#141414", border: "1px solid #2a2a2a" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(168,255,87,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a";
                }}
              >
                <span
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-lg"
                  style={{
                    background: "rgba(168,255,87,0.10)",
                    color: "#a8ff57",
                    border: "1px solid rgba(168,255,87,0.25)",
                  }}
                  aria-hidden
                >
                  <item.icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white group-hover:text-white">
                    {item.title}
                  </div>
                  <div className="mt-0.5 text-xs leading-snug text-white/60">
                    {item.description}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="rounded-xl p-5"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-display text-base font-semibold text-white">Безопасность сессии</h2>
            <p className="text-sm text-white/55">
              Если вы заметили подозрительную активность, выйдите из аккаунта и при следующем входе
              укажите новый пароль.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            disabled={logoutMut.isPending}
            className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#2a2a2a]"
          >
            <LogOut className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Выйти из аккаунта
          </Button>
        </div>
      </section>
    </div>
  );
}

function ProfileFieldGrid({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-3">
          <dt className="text-white/45">{r.label}</dt>
          <dd className="truncate text-white/85">{r.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
