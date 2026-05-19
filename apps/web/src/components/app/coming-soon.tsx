/**
 * ComingSoon — единая заглушка для разделов кабинета,
 * которые будут реализованы позже (Knowledge, Chat, Visitors, Calls,
 * Integrations, API Keys, Audit, Onboarding).
 */
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function ComingSoon({ title, description, icon: Icon }: ComingSoonProps) {
  return (
    <div className="space-y-8">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={<Icon className="h-5 w-5" strokeWidth={1.75} />}
        title="Скоро здесь"
        description="Раздел готовится. Мы откроем его в ближайшем релизе."
      />
    </div>
  );
}
