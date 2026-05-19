/**
 * Phase 12D — explain browser automation when overview shows queued runs.
 */
import { ProductNudgeBanner } from "@/components/product/product-nudge-banner";
import { FeatureMaturityBadge } from "@/components/product/feature-maturity-badge";
import { RUNTIME_SURFACE_MATURITY } from "@/lib/product/feature-maturity";

export function BrowserOnboardingHint(props: { browserQueuedCount: number }) {
  if (props.browserQueuedCount <= 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs text-white/50">Браузерные сценарии</span>
        <FeatureMaturityBadge maturity={RUNTIME_SURFACE_MATURITY.browser} />
      </div>
      <ProductNudgeBanner
        storageKey="bm.nudge.browser.onboarding"
        tone="blue"
        title="Есть задачи в очереди браузера"
        body="Сценарии работают через воркера с Playwright. Запуски появятся здесь, когда будут связаны с чатом. Начните с короткого теста на staging."
        ctaLabel="Интеграции"
        ctaTo="/app-integrations"
      />
    </div>
  );
}
