/**
 * ScenariosSection — 6 ниш с одной метрикой каждая.
 */
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { useScenarios } from "@/lib/hooks/use-landing";

export function ScenariosSection() {
  const { data: scenarios = [] } = useScenarios();

  return (
    <Section tone="muted" size="md">
      <Container>
        <SectionHeading
          eyebrow="Сценарии"
          title="Понимаем специфику вашей ниши"
          description="Каждый сценарий — это отдельный набор сценариев, тональностей и интеграций. Ниже — что мы уже сделали."
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="font-display text-[15px] font-semibold text-foreground">
                {s.title}
              </div>
              <p className="mt-1.5 text-sm text-ink-muted">{s.bullet}</p>
              <div className="mt-4 inline-flex items-center rounded-sm border border-border bg-background px-2 py-1 text-xs font-medium tabular text-foreground">
                {s.metric}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
