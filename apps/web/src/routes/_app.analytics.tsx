/**
 * /app/analytics — аналитика (только реальные данные).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { FeatureEmptyState } from "@/components/app/feature-empty-state";
import { ProductApiGate } from "@/components/app/product-api-gate";
import { useProductActivation } from "@/lib/hooks/use-product-activation";
import { useLeads, useAssistants } from "@/lib/hooks/use-app";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [{ title: "Аналитика — botme" }],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <ProductApiGate title="Аналитика">
      <AnalyticsContent />
    </ProductApiGate>
  );
}

function AnalyticsContent() {
  const activation = useProductActivation();
  const { data: leads } = useLeads();
  const { data: assistants } = useAssistants();

  if (activation.isLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  }

  const m = activation.data?.milestones;
  const hasAny =
    (leads?.length ?? 0) > 0 ||
    (assistants?.length ?? 0) > 0 ||
    m?.firstChatSuccess ||
    m?.firstExecutionRecorded;

  if (!hasAny) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Аналитика"
          description="Появится после первых диалогов, лидов и выполнений."
        />
        <FeatureEmptyState
          icon={BarChart3}
          title="Пока нет данных для графиков"
          description="Создайте ассистента, подключите OpenAI и проведите тестовый чат — метрики подтянутся из базы автоматически."
          actionLabel="Открыть чат"
          actionTo="/chat"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Аналитика"
        description="Сводка по активации продукта (данные из API, без демо-графиков)."
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Ассистентов" value={String(assistants?.length ?? 0)} />
        <Stat label="Лидов" value={String(leads?.length ?? 0)} />
        <Stat
          label="Первый чат"
          value={m?.firstChatSuccess ? "Да" : "Нет"}
        />
        <Stat
          label="Runtime открыт"
          value={m?.runtimeOpened ? "Да" : "Нет"}
        />
      </section>
      <p className="text-sm text-muted-foreground">
        Детальные графики 30 дней появятся в следующем релизе. Сейчас отображаются только
        факты из{" "}
        <Link to="/workspace" className="text-lime-600 underline">
          рабочей области
        </Link>
        .
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
