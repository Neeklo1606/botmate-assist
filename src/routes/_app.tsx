/**
 * _app — protected layout кабинета.
 *
 * Дизайн (по спеке Botmate):
 * - Левый сайдбар 240px, фон #0f0f0f, основной текст светлый.
 * - Активный пункт: белый текст + узкий лаймовый бордер слева (#a8ff57).
 * - Профиль (avatar) и Settings — внизу сайдбара.
 * - Основная область: фон #141414, на всю высоту экрана.
 *
 * Если не авторизован → /login?redirect=<current>.
 */
import {
  Outlet,
  Link,
  createFileRoute,
  redirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  MessageCircle,
  Users,
  Phone,
  Inbox,
  Plug,
  KeyRound,
  ShieldCheck,
  Settings,
  Bell,
  LogOut,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLogout } from "@/lib/hooks/use-auth";
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/lib/hooks/use-app";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/app/breadcrumbs";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AppLayout,
});

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/assistants", label: "Assistants", icon: Bot },
  { to: "/knowledge", label: "Knowledge", icon: BookOpen },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/visitors", label: "Visitors", icon: Users },
  { to: "/calls", label: "Calls", icon: Phone },
  { to: "/leads", label: "Leads", icon: Inbox },
  { to: "/app-integrations", label: "Integrations", icon: Plug },
  { to: "/api-keys", label: "API Keys", icon: KeyRound },
  { to: "/audit", label: "Audit", icon: ShieldCheck },
];

const MOBILE_NAV: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/assistants", label: "Assistants", icon: Bot },
  { to: "/leads", label: "Leads", icon: Inbox },
  { to: "/settings", label: "More", icon: Settings },
];

function AppLayout() {
  return (
    <div className="flex min-h-screen" style={{ background: "#141414" }}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-hidden pb-[72px] md:pb-0">
          <div className="container-px mx-auto w-full max-w-[1280px] py-4 md:py-6 text-foreground">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}

/* ───── Sidebar (desktop) ───── */

function Sidebar() {
  const location = useLocation();
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[240px] flex-none flex-col md:flex"
      style={{ background: "#0f0f0f", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Logo */}
      <div
        className="flex h-14 items-center px-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Link
          to="/app"
          aria-label="botme — кабинет"
          className="inline-flex items-baseline font-display text-[20px] font-semibold tracking-tight leading-none text-white select-none"
        >
          <span className="relative">
            botme
            <span
              aria-hidden
              className="absolute -top-[3px] right-[14px] h-[5px] w-[5px] rounded-full"
              style={{ background: "#a8ff57" }}
            />
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav aria-label="Кабинет" className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname === item.to ||
                location.pathname.startsWith(`${item.to}/`);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  )}
                  style={{
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.62)",
                    background: isActive ? "rgba(168,255,87,0.06)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = "#ffffff";
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.04)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.62)";
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }
                  }}
                >
                  {/* Lime left-border accent for active */}
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 -translate-y-1/2"
                      style={{
                        width: 3,
                        height: 22,
                        background: "#a8ff57",
                        borderRadius: 2,
                      }}
                    />
                  )}
                  <item.icon className="h-4 w-4" strokeWidth={1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom: profile + settings */}
      <div
        className="px-2 pb-3 pt-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <SidebarSettingsLink active={location.pathname.startsWith("/settings")} />
        <SidebarProfile />
      </div>
    </aside>
  );
}

function SidebarSettingsLink({ active }: { active: boolean }) {
  return (
    <Link
      to="/settings"
      className="relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors"
      style={{
        color: active ? "#ffffff" : "rgba(255,255,255,0.62)",
        background: active ? "rgba(168,255,87,0.06)" : "transparent",
      }}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2"
          style={{ width: 3, height: 22, background: "#a8ff57", borderRadius: 2 }}
        />
      )}
      <Settings className="h-4 w-4" strokeWidth={1.75} />
      Settings
    </Link>
  );
}

function SidebarProfile() {
  const { data: user } = useCurrentUser();
  const logoutMut = useLogout();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm font-medium transition-colors"
          style={{ color: "rgba(255,255,255,0.85)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "transparent")
          }
        >
          <span
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold"
            style={{ background: "#a8ff57", color: "#0f0f0f" }}
          >
            {user.avatarInitials}
          </span>
          <span className="min-w-0 flex-1 truncate">{user.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm font-semibold text-foreground">{user.name}</div>
          <div className="text-xs font-normal text-ink-muted">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/">← На главную</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logoutMut.mutate(undefined, {
              onSuccess: () => {
                toast.success("Вы вышли из аккаунта");
                navigate({ to: "/" });
              },
            });
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" strokeWidth={1.75} />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ───── Topbar ───── */

function Topbar() {
  const { data: user } = useCurrentUser();
  const { data: notifications } = useNotifications();
  const markOneMut = useMarkNotificationRead();
  const markAllMut = useMarkAllNotificationsRead();
  const logoutMut = useLogout();
  const navigate = useNavigate();

  const unread = notifications?.filter((n) => !n.read).length ?? 0;
  // MOCK: live online counter — заменить на realtime подписку
  const onlineNow = 7;

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 px-4 md:px-6"
      style={{
        background: "#141414",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.9)",
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="md:hidden">
          <Link
            to="/app"
            className="inline-flex items-baseline font-display text-[18px] font-semibold tracking-tight text-white"
          >
            <span className="relative">
              botme
              <span
                aria-hidden
                className="absolute -top-[3px] right-[12px] h-[5px] w-[5px] rounded-full"
                style={{ background: "#a8ff57" }}
              />
            </span>
          </Link>
        </div>
        <div className="hidden text-sm md:block" style={{ color: "rgba(255,255,255,0.55)" }}>
          {user?.workspaceName ?? "Workspace"}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Live online pill */}
        <div
          className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex"
          style={{
            background: "rgba(168,255,87,0.10)",
            color: "#a8ff57",
            border: "1px solid rgba(168,255,87,0.25)",
          }}
          title="Посетители на сайте сейчас"
        >
          <span className="relative inline-flex h-2 w-2">
            <span
              aria-hidden
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
              style={{ background: "#a8ff57" }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ background: "#a8ff57" }}
            />
          </span>
          Онлайн: <span className="tabular-nums">{onlineNow}</span>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Уведомления${unread ? `, непрочитанных: ${unread}` : ""}`}
              className="relative text-white hover:bg-white/5 hover:text-white"
            >
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              {unread > 0 && (
                <span
                  className="absolute right-1 top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none text-[#0f0f0f] tabular-nums"
                  style={{ background: "#a8ff57" }}
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
              <div className="text-sm font-semibold">Уведомления</div>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    markAllMut.mutate(undefined, {
                      onSuccess: () => toast.success("Все уведомления прочитаны"),
                    });
                  }}
                  className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-foreground"
                >
                  <Check className="h-3 w-3" strokeWidth={2} /> Прочитать все
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-ink-muted">
                  Нет уведомлений
                </div>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => !n.read && markOneMut.mutate(n.id)}
                    className={cn(
                      "flex w-full items-start gap-2 border-b border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-surface-muted",
                    )}
                  >
                    {!n.read && (
                      <span
                        aria-hidden
                        className="mt-1.5 inline-flex h-2 w-2 flex-none rounded-full"
                        style={{ background: "#a8ff57" }}
                      />
                    )}
                    <div className={cn("min-w-0 flex-1", n.read && "pl-4")}>
                      <div className="text-sm font-medium text-foreground">
                        {n.title}
                      </div>
                      {n.body && (
                        <div className="mt-0.5 line-clamp-2 text-xs text-ink-muted">
                          {n.body}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar (desktop) */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Профиль"
                className="hidden h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-opacity hover:opacity-90 md:inline-flex"
                style={{ background: "#a8ff57", color: "#0f0f0f" }}
              >
                {user.avatarInitials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="text-sm font-semibold text-foreground">{user.name}</div>
                <div className="text-xs font-normal text-ink-muted">{user.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">Настройки</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/">← На главную</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logoutMut.mutate(undefined, {
                    onSuccess: () => {
                      toast.success("Вы вышли из аккаунта");
                      navigate({ to: "/" });
                    },
                  });
                }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

/* ───── Mobile bottom nav ───── */

function MobileBottomNav() {
  const location = useLocation();
  return (
    <nav
      aria-label="Мобильная навигация"
      className="fixed inset-x-0 bottom-0 z-30 grid h-[64px] grid-cols-4 md:hidden"
      style={{
        background: "#0f0f0f",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {MOBILE_NAV.map((item) => {
        const isActive = item.exact
          ? location.pathname === item.to
          : location.pathname === item.to ||
            location.pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors"
            style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.55)" }}
          >
            <item.icon className="h-5 w-5" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
