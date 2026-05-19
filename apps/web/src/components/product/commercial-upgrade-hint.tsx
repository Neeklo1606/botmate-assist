/**
 * Phase 12D — explain runtime value when user has chat but never opened runtime.
 */
import { useProductActivation } from "@/lib/hooks/use-product-activation";
import { isRealAuthEnabled } from "@/lib/auth/config";
import { runtimeTenantUiEnabled } from "@/lib/runtime/config";
import { ProductNudgeBanner } from "@/components/product/product-nudge-banner";

export function CommercialRuntimeValueHint() {
  const activation = useProductActivation(isRealAuthEnabled());

  if (!runtimeTenantUiEnabled()) return null;
  const m = activation.data?.milestones;
  if (!m?.firstChatSuccess || m.runtimeOpened) return null;

  return (
    <ProductNudgeBanner
      storageKey="bm.nudge.commercial.runtime_value"
      title="«Про»: видны все запуски ассистента"
      body="Журнал исполнений показывает решения политик, ошибки и связь с браузером в одном месте — удобно для операторов и аудита."
      ctaLabel="Открыть исполнения"
      ctaTo="/runtime"
    />
  );
}
