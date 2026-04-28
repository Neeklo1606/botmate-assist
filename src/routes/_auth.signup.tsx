/**
 * /signup — регистрация по email/password (mock).
 * После успеха → /onboarding.
 */
import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useSignupWithEmail } from "@/lib/hooks/use-auth";

export const Route = createFileRoute("/_auth/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const signup = useSignupWithEmail();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Заполните все поля");
      return;
    }
    if (password.length < 6) {
      toast.error("Пароль должен быть не короче 6 символов");
      return;
    }
    // TODO: replace with real API — POST /api/auth/signup
    signup.mutate(
      { name, email, password },
      {
        onSuccess: () => {
          toast.success("Аккаунт создан. Поехали!");
          navigate({ to: "/onboarding" });
        },
        onError: () => toast.error("Не удалось создать аккаунт"),
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
          Создать аккаунт
        </h1>
        <p className="mt-1.5 text-center text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          Бесплатно. Без карты. Полный доступ 14 дней.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-xs font-medium"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Имя
            </label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван Иванов"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-white/20"
            />
          </div>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-white/20"
            />
          </div>

          <button
            type="submit"
            disabled={signup.isPending}
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ background: "#a8ff57", color: "#000000" }}
          >
            {signup.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Создаём аккаунт…
              </>
            ) : (
              "Создать аккаунт"
            )}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          Уже есть аккаунт?{" "}
          <Link
            to="/login"
            className="font-medium underline-offset-4 hover:underline"
            style={{ color: "#a8ff57" }}
          >
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
