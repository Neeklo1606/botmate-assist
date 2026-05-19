/**
 * Phase 12D — inactivity / stuck / at-risk retention nudges.
 */
import { useProductActivation } from "@/lib/hooks/use-product-activation";
import { isRealAuthEnabled } from "@/lib/auth/config";
import { runtimeTenantUiEnabled } from "@/lib/runtime/config";
import { ProductNudgeBanner } from "@/components/product/product-nudge-banner";

export function RetentionNudgeBanner() {
  const activation = useProductActivation(isRealAuthEnabled());
  const health = activation.data?.health;

  if (!health || health === "healthy" || health === "activating") return null;

  if (health === "stuck") {
    return (
      <ProductNudgeBanner
        storageKey="bm.nudge.retention.stuck"
        tone="amber"
        title="Настройка не завершена"
        body={
          activation.data?.hints[0] ??
          "Создайте ассистента, загрузите знания и попробуйте чат — это раскроет основную ценность."
        }
        ctaLabel="Продолжить настройку"
        ctaTo="/app"
      />
    );
  }

  if (health === "inactive") {
    return (
      <ProductNudgeBanner
        storageKey="bm.nudge.retention.inactive"
        tone="blue"
        title="С возвращением"
        body="В рабочей области давно не было активности. Отправьте тестовое сообщение или проверьте новые лиды."
        ctaLabel="Открыть чат"
        ctaTo="/chat"
      />
    );
  }

  if (health === "at_risk") {
    return (
      <ProductNudgeBanner
        storageKey="bm.nudge.retention.at_risk"
        tone="amber"
        title="Обнаружены проблемы со связью"
        body="Замечены ошибки реального времени или исполнений. Проверьте интеграции и сеть или напишите в поддержку."
        ctaLabel={runtimeTenantUiEnabled() ? "Открыть исполнения" : "Открыть интеграции"}
        ctaTo={runtimeTenantUiEnabled() ? "/runtime" : "/app-integrations"}
      />
    );
  }

  return null;
}
