/**
 * FeaturesSection — 4 ключевых возможности с lucide-иконками.
 */
import { MessageSquare, Filter, Target, Database, type LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { useFeatures } from "@/lib/hooks/use-landing";
import { useLocale } from "@/lib/i18n/locale";

const iconMap: Record<string, LucideIcon> = {
  MessageSquare,
  Filter,
  Target,
  Database,
};

export function FeaturesSection() {
  const { data: features = [] } = useFeatures();
  const { t } = useLocale();

  return (
    <Section tone="muted" size="md">
      <Container>
        <SectionHeading
          eyebrow={t("features.eyebrow")}
          title={t("features.title")}
          description={t("features.desc")}
        />

        <RevealGroup className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = iconMap[f.icon] ?? MessageSquare;
            return (
              <RevealItem
                key={f.id}
                className="rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm sm:p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-foreground text-background">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="mt-4 font-display text-lg font-semibold text-foreground">
                  {f.title}
                </div>
                <p className="mt-2 text-sm text-ink-muted">{f.description}</p>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Container>
    </Section>
  );
}
