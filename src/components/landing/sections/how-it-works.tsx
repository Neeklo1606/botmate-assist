/**
 * HowItWorks — 4 шага запуска. Простой grid c номерами.
 */
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { useHowItWorks } from "@/lib/hooks/use-landing";

export function HowItWorks() {
  const { data: steps = [] } = useHowItWorks();

  return (
    <Section id="how" tone="default" size="md">
      <Container>
        <SectionHeading
          eyebrow="Как это работает"
          title="От «хочу попробовать» до первого ответа клиента за 3 дня"
          description="Без долгих внедрений и кода. Мы делаем ассистента руками, вы согласовываете тексты и сценарии."
        />

        <RevealGroup as="ol" className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
          {steps.map((step) => (
            <RevealItem
              key={step.id}
              as="li"
              className="group rounded-xl border border-border bg-surface p-5 py-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-sm md:p-5 md:py-7"
            >
              <div className="font-display text-xs font-semibold tabular text-ink-subtle">
                {step.number}
              </div>
              <div className="mt-3 font-display text-lg font-semibold leading-snug text-foreground">
                {step.title}
              </div>
              <p className="mt-2 text-sm text-ink-muted">{step.description}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
