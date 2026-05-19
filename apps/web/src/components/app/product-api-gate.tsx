import { Link } from "@tanstack/react-router";
import { Database } from "lucide-react";
import { useCurrentUser } from "@/lib/hooks/use-auth";
import { isRealAuthEnabled } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";

/** Blocks cabinet pages when mock auth or missing tenant — no fake fallback data. */
export function ProductApiGate(props: { children: React.ReactNode; title?: string }) {
  const { data: user, isLoading } = useCurrentUser();

  if (!isRealAuthEnabled()) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <Database className="h-10 w-10 text-white/30" strokeWidth={1.5} />
        <h1 className="text-lg font-semibold text-white">{props.title ?? "Требуется вход"}</h1>
        <p className="max-w-md text-sm text-white/50">
          Включите <code className="text-lime-300/90">VITE_USE_REAL_AUTH=true</code> и войдите в аккаунт — демо-данные
          отключены.
        </p>
        <Button asChild variant="brand" size="sm">
          <Link to="/login">Войти</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-white/50">Загрузка…</div>;
  }

  if (!user?.tenantId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-white/50">Рабочая область не найдена. Войдите снова.</p>
        <Button asChild variant="brand" size="sm">
          <Link to="/login">Войти</Link>
        </Button>
      </div>
    );
  }

  return props.children;
}
