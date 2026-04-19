/**
 * /login — вход через Telegram (mock).
 * После успеха — редирект по ?redirect= или на /app.
 */
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLoginWithTelegram } from "@/lib/hooks/use-auth";

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute("/_auth/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = useSearch({ from: "/_auth/login" });
  const navigate = useNavigate();
  const login = useLoginWithTelegram();

  const handleLogin = () => {
    login.mutate(undefined, {
      onSuccess: (user) => {
        toast.success(`С возвращением, ${user.name.split(" ")[0]}`);
        navigate({ to: redirect ?? "/app" });
      },
      onError: () => {
        toast.error("Не удалось войти. Попробуйте ещё раз.");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Войти в botme
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Используем Telegram, чтобы не плодить пароли.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <Button
          variant="brand"
          size="lg"
          className="w-full"
          onClick={handleLogin}
          disabled={login.isPending}
        >
          {login.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Открываем Telegram…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Войти через Telegram
            </>
          )}
        </Button>

        <p className="mt-4 text-center text-xs text-ink-subtle">
          Нажимая «Войти», вы соглашаетесь с{" "}
          <Link to="/" className="underline decoration-accent decoration-2 underline-offset-2">
            офертой
          </Link>{" "}
          и{" "}
          <Link to="/" className="underline decoration-accent decoration-2 underline-offset-2">
            политикой
          </Link>
          .
        </p>
      </div>

      <div className="text-center text-sm text-ink-muted">
        Ещё нет аккаунта?{" "}
        <Link
          to="/signup"
          className="font-medium text-foreground underline decoration-accent decoration-2 underline-offset-4"
        >
          Создать
        </Link>
      </div>
    </div>
  );
}
