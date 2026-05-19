/**
 * Phase 12D — next activation step from product/activation API.
 */
import { activationNextStep, useProductActivation } from "@/lib/hooks/use-product-activation";
import { isRealAuthEnabled } from "@/lib/auth/config";
import { ProductNudgeBanner } from "@/components/product/product-nudge-banner";

export function GuidedSetupNudges() {
  const activation = useProductActivation(isRealAuthEnabled());
  const next = activationNextStep(activation.data);

  if (!next) return null;

  return (
    <ProductNudgeBanner
      storageKey={`bm.nudge.setup.${next.href}`}
      title="Следующий шаг к запуску"
      body={next.reason}
      ctaLabel={next.label}
      ctaTo={next.href}
    />
  );
}
