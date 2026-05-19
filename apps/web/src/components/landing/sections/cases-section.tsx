/**
 * CasesSection — 3 кейса с цитатой и метрикой.
 */
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { useCases } from "@/lib/hooks/use-landing";
import { nicheLabel } from "@/lib/format";
import { useLocale } from "@/lib/i18n/locale";

export function CasesSection() {
  const { data: cases = [] } = useCases();
  const { t, locale } = useLocale();

  return (
    <Section tone="muted" size="md">
      <Container>
        <SectionHeading
          eyebrow={t("cases.eyebrow")}
          title={t("cases.title")}
          description={t("cases.desc")}
        />

        <RevealGroup className="grid gap-4 md:grid-cols-3">
          {cases.map((c) => (
            <RevealItem
              key={c.id}
              as="article"
              className="flex flex-col rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="inline-flex w-fit items-center rounded-full border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                {nicheLabel(c.niche, locale)}
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
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
