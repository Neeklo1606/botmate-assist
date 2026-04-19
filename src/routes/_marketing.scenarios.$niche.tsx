/**
 * /scenarios/$niche — детальная посадочная под одну нишу.
 * Hero + tasks + mock-чат + интеграции + ref на кейс + CTA.
 */
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { MockChat } from "@/components/landing/mock-chat";
import { useScenarioDetail, useCaseStudy } from "@/lib/hooks/use-marketing";
import { FinalCTA } from "@/components/landing/sections/final-cta";
import type { Niche } from "@/types/entities";

const VALID_NICHES: Niche[] = [
  "real_estate",
  "auto",
  "clinic",
  "services",
  "online_school",
  "agency",
  "other",
];

export const Route = createFileRoute("/_marketing/scenarios/$niche")({
  head: ({ params }) => ({
    meta: [
      { title: `AI-ассистент для ниши ${params.niche}: botme` },
      {
        name: "description",
        content: `Готовый AI-ассистент под нишу ${params.niche}: задачи, диалог, интеграции и кейс клиента.`,
      },
      {
        property: "og:title",
        content: `AI-ассистент для ниши ${params.niche}: botme`,
      },
      {
        property: "og:description",
        content: "Сценарий ассистента под индустрию.",
      },
    ],
  }),
  loader: async ({ params }) => {
    if (!VALID_NICHES.includes(params.niche as Niche)) {
      throw notFound();
    }
    return null;
  },
  notFoundComponent: () => (
    <Section size="lg">
      <Container>
        <div className="mx-auto max-w-md text-center">
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Сценарий не найден
          </h1>
          <Button asChild variant="brand" size="md" className="mt-5">
            <Link to="/scenarios">Все сценарии</Link>
          </Button>
        </div>
      </Container>
    </Section>
  ),
  component: ScenarioPage,
});

function ScenarioPage() {
  const { niche } = Route.useParams();
  const { data: scenario, isLoading } = useScenarioDetail(niche as Niche);
  const { data: caseStudy } = useCaseStudy(scenario?.caseSlug ?? "");

  if (isLoading) {
    return (
      <Section size="lg">
        <Container>
          <div className="h-[480px] animate-pulse rounded-xl bg-surface-muted" />
        </Container>
      </Section>
    );
  }

  if (!scenario) {
    return (
      <Section size="lg">
        <Container>
          <div className="mx-auto max-w-md text-center">
            <h1 className="font-display text-3xl font-semibold text-foreground">
              Сценарий не найден
            </h1>
            <Button asChild variant="brand" size="md" className="mt-5">
              <Link to="/scenarios">Все сценарии</Link>
            </Button>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <>
      {/* Hero */}
      <Section size="md">
        <Container>
          <Link
            to="/scenarios"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Все сценарии
          </Link>
          <div className="grid items-center gap-10 md:grid-cols-12">
            <div className="md:col-span-6">
              <div className="text-xs uppercase tracking-wide text-ink-subtle">
                {scenario.industry}
              </div>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-5xl md:leading-[1.1]">
                {scenario.title}
              </h1>
              <p className="mt-5 text-base text-ink-muted md:text-lg">{scenario.pain}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="brand" size="lg">
                  <Link to="/" hash="demo">
                    Демо под мою нишу
                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/pricing">Тарифы</Link>
                </Button>
              </div>
            </div>
            <div className="md:col-span-6">
              {scenario.dialog.length > 0 ? (
                <MockChat
                  title={`botme · ${scenario.industry}`}
                  subtitle="отвечает за 7 секунд"
                  messages={scenario.dialog}
                />
              ) : (
                <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-ink-muted">
                  Диалог под эту нишу собирается индивидуально.
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* Tasks */}
      <Section tone="muted" size="md">
        <Container>
          <div className="mx-auto max-w-[720px]">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Что делает ассистент в этой нише
            </h2>
            <ul className="mt-6 space-y-3">
              {scenario.tasks.map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background p-4"
                >
                  <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent">
                    <Check className="h-3.5 w-3.5 text-accent-ink" strokeWidth={3} />
                  </span>
                  <span className="text-[15px] text-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Integrations */}
      {scenario.integrations.length > 0 ? (
        <Section size="md">
          <Container>
            <div className="mx-auto max-w-[920px]">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Какие связки используем
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {scenario.integrations.map((i) => (
                  <div key={i.name} className="rounded-xl border border-border bg-surface p-4">
                    <div className="font-display text-base font-semibold text-foreground">
                      {i.name}
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{i.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Case ref */}
      {caseStudy ? (
        <Section tone="muted" size="md">
          <Container>
            <div className="rounded-xl border border-border bg-background p-6 md:p-8">
              <div className="text-xs uppercase tracking-wide text-ink-subtle">
                Кейс в этой нише
              </div>
              <h3 className="mt-2 font-display text-2xl font-semibold text-foreground">
                {caseStudy.company}
              </h3>
              <p className="mt-2 text-[15px] text-ink-muted">{caseStudy.summary}</p>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-5">
                {caseStudy.heroMetrics.map((m) => (
                  <div key={m.label}>
                    <div className="font-display text-2xl font-semibold tabular-nums text-foreground">
                      {m.value}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-wide text-ink-subtle">
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
              <Button asChild variant="brand" size="md" className="mt-6">
                <Link to="/cases/$slug" params={{ slug: caseStudy.slug }}>
                  Читать кейс целиком
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                </Link>
              </Button>
            </div>
          </Container>
        </Section>
      ) : null}

      <FinalCTA />
    </>
  );
}
