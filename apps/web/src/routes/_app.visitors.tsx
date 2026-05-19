import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ProductApiGate } from "@/components/app/product-api-gate";
import { FeatureEmptyState } from "@/components/app/feature-empty-state";

export const Route = createFileRoute("/_app/visitors")({
  head: () => ({
    meta: [{ title: "Посетители — botme" }],
  }),
  component: VisitorsPage,
});

function VisitorsPage() {
  return (
    <ProductApiGate title="Посетители">
      <FeatureEmptyState
        icon={Users}
        title="Нет данных о посетителях"
        description="Отслеживание посетителей на сайте появится после подключения виджета и накопления реальных сессий. Сейчас отображаются только данные из базы — фейковые посетители отключены."
        actionLabel="Открыть чат"
        actionTo="/chat"
      />
    </ProductApiGate>
  );
}
