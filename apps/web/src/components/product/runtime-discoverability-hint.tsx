/**
 * Phase 12B — nudge operators toward Runtime when tenant UI is enabled.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, ArrowRight, X } from "lucide-react";
import { runtimeTenantUiEnabled } from "@/lib/runtime/config";

const STORAGE_KEY = "bm.runtime.discoverability.dismissed";

export function RuntimeDiscoverabilityHint() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!runtimeTenantUiEnabled() || dismissed) return null;

  return (
    <section
      className="flex flex-col gap-3 rounded-xl border border-lime-500/25 bg-lime-500/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Рабочее пространство исполнений"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-lime-500/15 text-lime-300"
          aria-hidden
        >
          <Activity className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">Журнал исполнений</p>
          <p className="mt-0.5 text-sm text-white/60">
            Разбирайте запуски ассистента, события политик, связь с браузером и работу оператора в одном рабочем пространстве.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/runtime"
          className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-sm font-medium text-black hover:bg-lime-300"
        >
          Открыть исполнения
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <button
          type="button"
          className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white/80"
          aria-label="Закрыть"
          onClick={() => {
            try {
              localStorage.setItem(STORAGE_KEY, "1");
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}
