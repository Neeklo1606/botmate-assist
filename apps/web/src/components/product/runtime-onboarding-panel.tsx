/**
 * Вводный блок Runtime для SMB (журнал исполнений, не оркестратор).
 */
import { Link } from "@tanstack/react-router";
import { Activity, BookOpen } from "lucide-react";
import { FeatureMaturityBadge } from "@/components/product/feature-maturity-badge";
import { RUNTIME_SURFACE_MATURITY } from "@/lib/product/feature-maturity";
import { useProductActivation } from "@/lib/hooks/use-product-activation";
import { isRealAuthEnabled } from "@/lib/auth/config";
import { CABINET_RU } from "@/lib/i18n/cabinet-ru";
import { runtimeWorkspaceUiEnabled } from "@/lib/runtime/config";

export function RuntimeOnboardingPanel() {
  const activation = useProductActivation(isRealAuthEnabled());
  const hasExecutions = (activation.data?.derived.executionsCount ?? 0) > 0;

  return (
    <section className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Activity className="size-4 text-lime-300" aria-hidden />
        <h2 className="text-sm font-medium text-white">{CABINET_RU.runtime.introTitle}</h2>
        <FeatureMaturityBadge maturity={RUNTIME_SURFACE_MATURITY.overview} />
      </div>
      <p className="mt-2 max-w-2xl text-sm text-white/60">{CABINET_RU.runtime.introBody}</p>
      <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-white/50">
        <li>Нажмите на строку, чтобы открыть детали, таймлайн и политики.</li>
        <li>{hasExecutions ? CABINET_RU.runtime.hasExecutions : CABINET_RU.runtime.noExecutions}</li>
        {runtimeWorkspaceUiEnabled() ?
          <li>{CABINET_RU.runtime.advancedHint}</li>
        : null}
      </ul>
      {!hasExecutions ?
        <Link
          to="/chat"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-lime-300 hover:text-lime-200"
        >
          <BookOpen className="size-3.5" aria-hidden />
          {CABINET_RU.common.goToChat}
        </Link>
      : null}
    </section>
  );
}
