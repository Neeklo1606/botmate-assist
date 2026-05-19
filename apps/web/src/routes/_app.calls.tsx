import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { ProductApiGate } from "@/components/app/product-api-gate";
import { FeatureEmptyState } from "@/components/app/feature-empty-state";

export const Route = createFileRoute("/_app/calls")({
  head: () => ({
    meta: [{ title: "Звонки — botme" }],
  }),
  component: CallsPage,
});

function CallsPage() {
  return (
    <ProductApiGate title="Звонки">
      <FeatureEmptyState
        icon={Phone}
        title="Телефония не подключена"
        description="Входящие и история звонков появятся после интеграции с телефонией. Демо-звонки и фейковая очередь отключены."
        actionLabel="Интеграции"
        actionTo="/workspace?tab=integrations"
      />
    </ProductApiGate>
  );
}
