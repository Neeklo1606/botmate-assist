/**
 * /login — вход по email/password (mock).
 * После успеха — редирект по ?redirect= или на /app.
 */
import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useLoginWithEmail } from "@/lib/hooks/use-auth";

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
  const login = useLoginWithEmail();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Введите email и пароль");
      return;
    }
    // TODO: replace with real API — POST /api/auth/login
    login.mutate(
      { email, password },
      {
        onSuccess: (user) => {
          toast.success(`С возвращением, ${user.name.split(" ")[0]}`);
          if (redirect) navigate({ href: redirect });
          else navigate({ to: "/app" });
        },
        onError: () => toast.error("Неверный email или пароль"),
      },
    );
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "#0a0a0a" }}
    >
      <div
        className="w-full max-w-[400px] rounded-xl p-8"
        style={{
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="mb-6 flex items-center justify-center">
          <span className="inline-flex items-baseline font-display text-[22px] font-semibold tracking-tight text-white">
            <span className="relative">
              botme
              <span
                aria-hidden
                className="absolute -top-[3px] right-[14px] h-[5px] w-[5px] rounded-full"
                style={{ background: "#a8ff57" }}
              />
            </span>
          </span>
        </div>

        <h1 className="text-center font-display text-xl font-semibold text-white">
          Войти в Botme
        </h1>
        <p className="mt-1.5 text-center text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          Используйте email и пароль аккаунта
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-white/20"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Пароль
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-white/20"
            />
          </div>

          <div className="pt-1 text-right">
            <Link
              to="/login"
              className="text-xs font-medium transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Забыли пароль?
            </Link>
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ background: "#a8ff57", color: "#000000" }}
          >
            {login.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Входим…
              </>
            ) : (
              "Войти"
            )}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          Нет аккаунта?{" "}
          <Link
            to="/signup"
            className="font-medium underline-offset-4 hover:underline"
            style={{ color: "#a8ff57" }}
          >
            Создать
          </Link>
        </p>
      </div>
    </div>
  );
}
