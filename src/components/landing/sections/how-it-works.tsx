/**
 * HowItWorks — 4 шага запуска. Простой grid c номерами.
 */
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { useHowItWorks } from "@/lib/hooks/use-landing";

export function HowItWorks() {
  const { data: steps = [] } = useHowItWorks();

  return (
    <Section id="how" tone="default" size="md">
      <Container>
        <SectionHeading
          eyebrow="Как это работает"
          title="От «хочу попробовать» до первого ответа клиента — 3 дня"
          description="Без долгих внедрений и кода. Мы делаем ассистента руками — вы согласовываете тексты и сценарии."
        />

        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li
              key={step.id}
              className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
            >
              <div className="font-display text-xs font-semibold tabular text-ink-subtle">
                {step.number}
              </div>
              <div className="mt-3 font-display text-lg font-semibold leading-snug text-foreground">
                {step.title}
              </div>
              <p className="mt-2 text-sm text-ink-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
