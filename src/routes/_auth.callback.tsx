/**
 * /callback — страница для возврата из OAuth-провайдера (mock).
 * Имитируем обработку и редирект на /app.
 */
import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useLoginWithTelegram } from "@/lib/hooks/use-auth";

export const Route = createFileRoute("/_auth/callback")({
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();
  const login = useLoginWithTelegram();

  useEffect(() => {
    login.mutate(undefined, {
      onSuccess: () => {
        navigate({ to: "/app", replace: true });
      },
      onError: () => {
        navigate({ to: "/login", replace: true });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
        <Loader2 className="h-6 w-6 animate-spin text-foreground" />
      </div>
      <h1 className="font-display text-xl font-semibold text-foreground">
        Завершаем вход…
      </h1>
      <p className="text-sm text-ink-muted">Пара секунд — и будем в кабинете.</p>
    </div>
  );
}
