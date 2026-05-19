/**
 * BenefitsSection — 4 преимущества против найма менеджера.
 */
import { Moon, BookOpen, Battery, Shield, type LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { useBenefits } from "@/lib/hooks/use-landing";
import { useLocale } from "@/lib/i18n/locale";

const iconMap: Record<string, LucideIcon> = { Moon, BookOpen, Battery, Shield };

export function BenefitsSection() {
  const { data: benefits = [] } = useBenefits();
  const { t } = useLocale();

  return (
    <Section tone="default" size="md">
      <Container>
        <SectionHeading
          eyebrow={t("benefits.eyebrow")}
          title={t("benefits.title")}
          description={t("benefits.desc")}
        />

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => {
            const Icon = iconMap[b.icon] ?? Shield;
            return (
              <div key={b.id} className="rounded-xl border border-border bg-surface p-5">
                <Icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                <div className="mt-4 font-display text-lg font-semibold text-foreground">
                  {b.title}
                </div>
                <p className="mt-2 text-sm text-ink-muted">{b.description}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
