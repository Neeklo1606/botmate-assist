/**
 * _app — protected layout кабинета.
 * Sidebar (desktop) + Topbar + Mobile bottom nav.
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
  Users2,
  Inbox,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { BotmeLogo } from "@/components/brand/botme-logo";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLogout } from "@/lib/hooks/use-auth";
import { useNotifications } from "@/lib/hooks/use-app";
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
  { to: "/app", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { to: "/app/assistants", label: "Ассистенты", icon: Bot },
  { to: "/app/leads", label: "Лиды", icon: Inbox },
  { to: "/app/analytics", label: "Аналитика", icon: BarChart3 },
  { to: "/app/team", label: "Команда", icon: Users2 },
  { to: "/app/settings", label: "Настройки", icon: Settings },
];

const MOBILE_NAV: NavItem[] = [
  { to: "/app", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { to: "/app/assistants", label: "Ассистенты", icon: Bot },
  { to: "/app/leads", label: "Лиды", icon: Inbox },
  { to: "/app/settings", label: "Ещё", icon: Settings },
];

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-surface-muted">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-hidden pb-[72px] md:pb-0">
          <div className="container-px mx-auto w-full max-w-[1280px] py-6 md:py-8">
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
    <aside className="sticky top-0 hidden h-screen w-[240px] flex-none flex-col border-r border-border bg-background md:flex">
      <div className="flex h-14 items-center border-b border-border px-5">
        <Link to="/app" aria-label="botme — кабинет">
          <BotmeLogo />
        </Link>
      </div>
      <nav aria-label="Кабинет" className="flex-1 space-y-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname === item.to ||
              location.pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "text-ink-muted hover:bg-surface-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          ← Вернуться на сайт
        </Link>
      </div>
    </aside>
  );
}

/* ───── Topbar ───── */

function Topbar() {
  const { data: user } = useCurrentUser();
  const { data: notifications } = useNotifications();
  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="md:hidden">
          <BotmeLogo />
        </div>
        <div className="hidden text-sm text-ink-muted md:block">
          {user?.workspaceName ?? "Workspace"}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghostInk" size="icon" aria-label="Уведомления" className="relative">
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 inline-flex h-2 w-2 rounded-full bg-accent" />
          )}
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}

function UserMenu() {
  const { data: user } = useCurrentUser();
  const logoutMut = useLogout();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
            {user.avatarInitials}
          </span>
          <span className="hidden md:inline">{user.name}</span>
          <ChevronDown className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm font-semibold text-foreground">{user.name}</div>
          <div className="text-xs font-normal text-ink-muted">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/app/settings">Настройки</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/faq">Помощь</Link>
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

/* ───── Mobile bottom nav ───── */

function MobileBottomNav() {
  const location = useLocation();
  return (
    <nav
      aria-label="Мобильная навигация"
      className="fixed inset-x-0 bottom-0 z-30 grid h-[64px] grid-cols-4 border-t border-border bg-background md:hidden"
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
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
              isActive ? "text-foreground" : "text-ink-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-5 w-5" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
