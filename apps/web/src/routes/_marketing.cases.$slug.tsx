/**
 * /cases/$slug — детальный кейс: задача → решение → setup → результат → цитата → related.
 */
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, MapPin, Quote } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { ChannelIcon } from "@/components/brand/channel-icon";
import { useCaseStudies, useCaseStudy } from "@/lib/hooks/use-marketing";
import { FinalCTA } from "@/components/landing/sections/final-cta";
import { repository } from "@/lib/mock/repository";
import { buildPageMeta, canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/cases/$slug")({
  loader: async ({ params }) => {
    if (!params.slug || params.slug.length > 60) {
      throw notFound();
    }
    const study = await repository.getCaseBySlug(params.slug);
    if (!study) throw notFound();
    return { study };
  },
  head: ({ loaderData, params }) => {
    const study = loaderData?.study;
    const title = study
      ? `${study.company} — кейс botme в нише ${study.industry}`
      : `Кейс — botme`;
    const description = study
      ? `${study.summary} Реальные метрики за 30 дней работы AI-ассистента botme.`
      : "Подробный кейс клиента botme: задача, решение, метрики и результат.";
    return {
      meta: buildPageMeta({
        title,
        description,
        path: `/cases/${params.slug}`,
        type: "article",
      }),
      links: [canonicalLink(`/cases/${params.slug}`)],
      scripts: study
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                headline: title,
                description,
                author: { "@type": "Organization", name: "botme" },
                publisher: { "@type": "Organization", name: "botme" },
                about: study.industry,
              }),
            },
          ]
        : [],
    };
  },
  notFoundComponent: () => (
    <Section size="lg">
      <Container>
        <div className="mx-auto max-w-md text-center">
          <h1 className="font-display text-3xl font-semibold text-foreground">Кейс не найден</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Возможно, ссылка устарела или кейс ещё не опубликован.
          </p>
          <Button asChild variant="brand" size="md" className="mt-5">
            <Link to="/cases">Все кейсы</Link>
          </Button>
        </div>
      </Container>
    </Section>
  ),
  component: CasePage,
});

function CasePage() {
  const { slug } = Route.useParams();
  const { data: study, isLoading } = useCaseStudy(slug);
  const { data: allCases = [] } = useCaseStudies();

  if (isLoading) {
    return (
      <Section size="lg">
        <Container>
          <div className="h-[480px] animate-pulse rounded-xl bg-surface-muted" />
        </Container>
      </Section>
    );
  }

  if (!study) {
    return (
      <Section size="lg">
        <Container>
          <div className="mx-auto max-w-md text-center">
            <h1 className="font-display text-3xl font-semibold text-foreground">Кейс не найден</h1>
            <Button asChild variant="brand" size="md" className="mt-5">
              <Link to="/cases">Все кейсы</Link>
            </Button>
          </div>
        </Container>
      </Section>
    );
  }

  const related = allCases.filter((c) => study.related.includes(c.slug)).slice(0, 2);

  return (
    <>
      {/* Hero */}
      <Section size="md">
        <Container>
          <Link
            to="/cases"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Все кейсы
          </Link>
          <div className="grid items-start gap-10 md:grid-cols-12">
            <div className="md:col-span-7">
              <div className="mb-3 flex items-center gap-2 text-xs text-ink-subtle">
                <span className="rounded-full bg-surface-muted px-2 py-0.5 font-medium text-foreground">
                  {study.industry}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" strokeWidth={1.75} />
                  {study.region}
                </span>
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-5xl md:leading-[1.1]">
                {study.company}
              </h1>
              <p className="mt-4 text-base text-ink-muted md:text-lg">{study.summary}</p>
            </div>
            <div className="md:col-span-5">
              <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-surface p-5">
                {study.heroMetrics.map((m) => (
                  <div key={m.label}>
                    <div className="font-display text-2xl font-semibold tabular-nums text-foreground">
                      {m.value}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-wide text-ink-subtle">
                      {m.label}
                    </div>
                    {m.delta ? (
                      <div className="mt-1 text-[11px] font-medium text-foreground">{m.delta}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Task + Solution */}
      <Section tone="muted" size="md">
        <Container>
          <div className="grid gap-10 md:grid-cols-2">
            <article>
              <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">Задача</h2>
              <div className="space-y-3 text-[15px] leading-relaxed text-ink-muted">
                {study.task.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </article>
            <article>
              <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">
                Что сделали
              </h2>
              <div className="space-y-3 text-[15px] leading-relaxed text-ink-muted">
                {study.solution.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </article>
          </div>
        </Container>
      </Section>

      {/* Setup */}
      <Section size="md">
        <Container>
          <div className="rounded-xl border border-border bg-surface p-6 md:p-8">
            <h2 className="mb-5 font-display text-xl font-semibold text-foreground">
              Конфигурация ассистента
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-subtle">Ассистент</div>
                <div className="mt-1.5 font-medium text-foreground">{study.setup.assistant}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-subtle">Каналы</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {study.setup.channels.map((ch) => (
                    <span
                      key={ch}
                      className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2 py-1 text-xs font-medium text-foreground"
                    >
                      <ChannelIcon id={ch} className="h-3.5 w-3.5" />
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-subtle">Интеграции</div>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {study.setup.integrations.map((it) => (
                    <span
                      key={it}
                      className="rounded-full bg-foreground px-2 py-1 text-xs font-medium text-background"
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Result + Quote */}
      <Section tone="muted" size="md">
        <Container>
          <h2 className="mb-6 font-display text-2xl font-semibold text-foreground">
            Результат за 30 дней
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {study.resultMetrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-border bg-background p-5">
                <div className="font-display text-3xl font-semibold tabular-nums text-foreground">
                  {m.value}
                </div>
                <div className="mt-1 text-sm text-ink-muted">{m.label}</div>
                {m.delta ? (
                  <div className="mt-2 inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-ink">
                    {m.delta}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <figure className="mt-10 rounded-xl border border-border bg-background p-6 md:p-8">
            <Quote className="h-8 w-8 text-accent" strokeWidth={1.5} aria-hidden />
            <blockquote className="mt-4 font-display text-xl font-medium leading-relaxed text-foreground md:text-2xl">
              «{study.quote.text}»
            </blockquote>
            <figcaption className="mt-5 text-sm text-ink-muted">
              <span className="font-medium text-foreground">{study.quote.author}</span>
              {", "}
              {study.quote.role}
            </figcaption>
          </figure>
        </Container>
      </Section>

      {/* Related */}
      {related.length > 0 ? (
        <Section size="md">
          <Container>
            <h2 className="mb-6 font-display text-xl font-semibold text-foreground">
              Похожие кейсы
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {related.map((c) => (
                <Link
                  key={c.slug}
                  to="/cases/$slug"
                  params={{ slug: c.slug }}
                  className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
                >
                  <div className="flex-1">
                    <div className="text-xs text-ink-subtle">{c.industry}</div>
                    <div className="mt-1 font-display text-base font-semibold text-foreground">
                      {c.company}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{c.summary}</p>
                  </div>
                  <ArrowRight
                    className="mt-1 h-5 w-5 flex-none text-ink-muted transition-transform group-hover:translate-x-0.5"
                    strokeWidth={1.5}
                  />
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <FinalCTA />
    </>
  );
}
