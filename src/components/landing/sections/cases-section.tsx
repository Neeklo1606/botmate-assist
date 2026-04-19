/**
 * CasesSection — 3 кейса с цитатой и метрикой.
 */
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { useCases } from "@/lib/hooks/use-landing";
import { nicheLabel } from "@/lib/format";

export function CasesSection() {
  const { data: cases = [] } = useCases();

  return (
    <Section tone="muted" size="md">
      <Container>
        <SectionHeading
          eyebrow="Кейсы"
          title="Как это работает у реальных клиентов"
          description="Цифры из живых проектов. Не «увеличили продажи в 10 раз», а конкретные заявки и часы."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {cases.map((c) => (
            <article
              key={c.id}
              className="flex flex-col rounded-xl border border-border bg-surface p-6"
            >
              <div className="inline-flex w-fit items-center rounded-full border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                {nicheLabel[c.niche]}
              </div>
              <div className="mt-4 font-display text-[28px] font-semibold tabular leading-none text-foreground">
                {c.metric}
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-snug text-foreground">
                «{c.quote}»
                       </blockquote>
              <footer className="mt-5 text-xs text-ink-muted">
                <div className="font-medium text-foreground">{c.company}</div>
                <div className="mt-0.5">{c.author}</div>
              </footer>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
