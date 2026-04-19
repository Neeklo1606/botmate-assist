/**
 * _auth — pathless layout для страниц авторизации.
 * Минимальный шелл: фон, центрирование, лого, link обратно.
 * Если пользователь уже залогинен — редирект на /app.
 */
import { Outlet, Link, createFileRoute, redirect } from "@tanstack/react-router";
import { BotmeLogo } from "@/components/brand/botme-logo";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/app" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="container-px mx-auto flex h-14 max-w-[1200px] items-center justify-between">
          <Link to="/" aria-label="botme — на главную">
            <BotmeLogo />
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-ink-muted transition-colors hover:text-foreground"
          >
            ← На главную
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
