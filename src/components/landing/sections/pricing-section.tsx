/**
 * PricingSection — 3 тарифа на лендинге. Pro highlighted с lime-рамкой.
 * Это compact-версия. Полная страница — /pricing.
 */
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { usePricing } from "@/lib/hooks/use-landing";
import { formatRub } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const { data: plans = [] } = usePricing();

  return (
    <Section id="pricing" tone="default" size="md" data-hide-sticky-cta>
      <Container>
        <SectionHeading
          eyebrow="Тарифы"
          title="Понятные цены. Без сюрпризов"
          description="Платите за работу ассистента, а не за «лицензии» и «места». Возврат в первые 14 дней."
        />

        <RevealGroup className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <RevealItem
              key={plan.id}
              as="article"
              className={cn(
                "relative flex flex-col rounded-xl border bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm",
                plan.highlighted ? "border-accent shadow-lift" : "border-border",
              )}
            >
              {plan.highlighted ? (
                <div className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-ink">
                  Хит
                </div>
              ) : null}

              <div className="font-display text-xl font-semibold text-foreground">{plan.name}</div>
              <p className="mt-1 text-sm text-ink-muted">{plan.tagline}</p>

              <div className="mt-5 flex items-baseline gap-1.5">
                <div className="font-display text-3xl font-semibold tabular text-foreground">
                  {formatRub(plan.priceRub)}
                </div>
                <div className="text-sm text-ink-muted">/ мес</div>
              </div>

              <ul className="mt-5 space-y-2.5">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" strokeWidth={1.5} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-4">
                <Button
                  asChild
                  variant={plan.cta.intent === "primary" ? "brand" : "outline"}
                  size="md"
                  className="w-full"
                >
                  <Link to="/" hash="demo">
                    {plan.cta.label}
                  </Link>
                </Button>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="mt-8 text-center text-sm text-ink-muted">
          Нужно сравнение тарифов и ответы по биллингу?{" "}
          <Link
            to="/pricing"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Подробная страница тарифов →
          </Link>
        </div>
      </Container>
    </Section>
  );
}
