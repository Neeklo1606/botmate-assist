/**
 * /signup — регистрация (mock = тот же login через Telegram).
 * Семантически — отдельная страница для аналитики и копирайтинга.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Send, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLoginWithTelegram } from "@/lib/hooks/use-auth";

export const Route = createFileRoute("/_auth/signup")({
  component: SignupPage,
});

const PERKS = [
  "Запуск ассистента за 3 дня",
  "Все каналы: Telegram, сайт, Avito, ВК",
  "Без карты на старте",
];

function SignupPage() {
  const navigate = useNavigate();
  const login = useLoginWithTelegram();

  const handleSignup = () => {
    login.mutate(undefined, {
      onSuccess: () => {
        toast.success("Аккаунт создан. Поехали!");
        navigate({ to: "/app" });
      },
      onError: () => {
        toast.error("Не удалось создать аккаунт. Попробуйте ещё раз.");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Создать аккаунт
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Бесплатно. Без карты. Полный доступ 14 дней.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <ul className="mb-5 space-y-2.5">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-center gap-2 text-sm text-foreground">
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent">
                <Check className="h-3 w-3 text-accent-ink" strokeWidth={3} />
              </span>
              {perk}
            </li>
          ))}
        </ul>

        <Button
          variant="brand"
          size="lg"
          className="w-full"
          onClick={handleSignup}
          disabled={login.isPending}
        >
          {login.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Создаём аккаунт…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Создать через Telegram
            </>
          )}
        </Button>

        <p className="mt-4 text-center text-xs text-ink-subtle">
          Регистрируясь, вы принимаете{" "}
          <Link to="/" className="underline decoration-accent decoration-2 underline-offset-2">
            оферту
          </Link>
          .
        </p>
      </div>

      <div className="text-center text-sm text-ink-muted">
        Уже есть аккаунт?{" "}
        <Link
          to="/login"
          className="font-medium text-foreground underline decoration-accent decoration-2 underline-offset-4"
        >
          Войти
        </Link>
      </div>
    </div>
  );
}
