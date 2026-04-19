/**
 * ScenariosSection — 6 ниш с одной метрикой каждая.
 */
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { useScenarios } from "@/lib/hooks/use-landing";

export function ScenariosSection() {
  const { data: scenarios = [] } = useScenarios();

  return (
    <Section tone="muted" size="md">
      <Container>
        <SectionHeading
          eyebrow="Сценарии"
          title="Понимаем специфику вашей ниши"
          description="Каждая ниша: свой набор сценариев, тональностей и интеграций. Ниже то, что мы уже сделали."
        />

        <RevealGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((s) => (
            <RevealItem
              key={s.id}
              className="rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="font-display text-[15px] font-semibold text-foreground">
                {s.title}
              </div>
              <p className="mt-1.5 text-sm text-ink-muted">{s.bullet}</p>
              <div className="mt-4 inline-flex w-max items-center rounded-sm border border-border bg-background px-2 py-1 text-xs font-medium tabular-nums text-foreground">
                {s.metric}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
