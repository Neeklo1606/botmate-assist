/**
 * /cases — список всех клиентских кейсов с метриками.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { useCaseStudies } from "@/lib/hooks/use-marketing";
import { FinalCTA } from "@/components/landing/sections/final-cta";
import { buildPageMeta, canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/cases")({
  head: () => ({
    meta: buildPageMeta({
      title: "Кейсы клиентов botme — реальные цифры по 6 нишам",
      description:
        "Как клиенты botme экономят на ФОТ, увеличивают конверсию и закрывают ночные заявки. Недвижимость, авто, клиники, услуги, школы, агентства.",
      path: "/cases",
    }),
    links: [canonicalLink("/cases")],
  }),
  component: CasesPage,
});

function CasesPage() {
  const { data: cases = [], isLoading } = useCaseStudies();

  return (
    <>
      <Section size="lg">
        <Container>
          <div className="mx-auto max-w-[820px] text-center">
            <div className="mb-4 inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Кейсы
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] md:text-[56px] md:leading-[1.05]">
              Что меняется через 30 дней после запуска
            </h1>
            <p className="mt-5 text-base text-ink-muted md:text-lg">
              6 клиентов из недвижимости, авто, клиник, школ, услуг и агентств. Цифры без
              приукрашивания.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="muted" size="md">
        <Container>
          <SectionHeading
            eyebrow="Истории клиентов"
            title="Полные кейсы с задачей, решением и результатом"
          />
          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[320px] animate-pulse rounded-xl border border-border bg-background"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {cases.map((c) => (
                <article
                  key={c.slug}
                  className="group flex flex-col rounded-xl border border-border bg-background p-6 transition-colors hover:border-border-strong"
                >
                  <div className="mb-3 flex items-center gap-2 text-xs text-ink-subtle">
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 font-medium text-foreground">
                      {c.industry}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" strokeWidth={1.75} />
                      {c.region}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {c.company}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{c.summary}</p>

                  <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-5">
                    {c.heroMetrics.map((m) => (
                      <div key={m.label}>
                        <div className="font-display text-xl font-semibold tabular-nums text-foreground">
                          {m.value}
                        </div>
                        <div className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-subtle">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs text-ink-subtle">
                      Цитата: «{c.quote.text.slice(0, 60)}…»
                    </span>
                    <Button asChild variant="ghostInk" size="sm">
                      <Link
                        to="/cases/$slug"
                        params={{ slug: c.slug }}
                        className="group-hover:translate-x-0.5 transition-transform"
                      >
                        Читать
                        <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Container>
      </Section>

      <FinalCTA />
    </>
  );
}
