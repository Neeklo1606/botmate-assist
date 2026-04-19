/**
 * /features — посадочная по возможностям продукта.
 * Hero + сетка возможностей + how-it-works + benefits + CTA.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Battery,
  BookOpen,
  Database,
  Filter,
  MessageSquare,
  Moon,
  Shield,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { useFeatures, useBenefits, useHowItWorks } from "@/lib/hooks/use-landing";
import { FinalCTA } from "@/components/landing/sections/final-cta";

export const Route = createFileRoute("/_marketing/features")({
  head: () => ({
    meta: [
      { title: "Возможности — botme" },
      {
        name: "description",
        content:
          "Что умеет AI-ассистент botme: отвечает за 7 секунд, квалифицирует лидов, доводит до сделки и пишет в CRM.",
      },
      { property: "og:title", content: "Возможности — botme" },
      {
        property: "og:description",
        content: "Полный список возможностей AI-ассистента botme.",
      },
    ],
  }),
  component: FeaturesPage,
});

const ICONS: Record<string, LucideIcon> = {
  MessageSquare,
  Filter,
  Target,
  Database,
  Moon,
  BookOpen,
  Battery,
  Shield,
};

function FeaturesPage() {
  const { data: features = [] } = useFeatures();
  const { data: benefits = [] } = useBenefits();
  const { data: how = [] } = useHowItWorks();

  return (
    <>
      {/* Hero */}
      <Section size="lg">
        <Container>
          <div className="mx-auto max-w-[820px] text-center">
            <div className="mb-4 inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Возможности
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] md:text-[56px] md:leading-[1.05]">
              Один ассистент закрывает работу команды поддержки и продаж
            </h1>
            <p className="mt-5 text-base text-ink-muted md:text-lg">
              botme отвечает клиентам мгновенно, квалифицирует, продаёт и складывает
              сделки в CRM. Без выходных и обеда.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="brand" size="lg">
                <Link to="/" hash="demo">
                  Получить демо
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/pricing">Посмотреть тарифы</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* Core features grid */}
      <Section tone="muted" size="md">
        <Container>
          <SectionHeading
            eyebrow="Что делает"
            title="4 ключевые роли в одном ассистенте"
            description="Не просто чат-бот по скриптам — полноценный сотрудник, который держит контекст и доводит до результата."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((f) => {
              const Icon = ICONS[f.icon] ?? MessageSquare;
              return (
                <article
                  key={f.id}
                  className="rounded-xl border border-border bg-background p-6 transition-colors hover:border-border-strong"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-foreground text-background">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {f.description}
                  </p>
                </article>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Benefits */}
      <Section size="md">
        <Container>
          <SectionHeading
            eyebrow="Почему это работает"
            title="То, чего не сделает живой менеджер"
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => {
              const Icon = ICONS[b.icon] ?? Shield;
              return (
                <div
                  key={b.id}
                  className="rounded-xl border border-border bg-surface p-5"
                >
                  <Icon
                    className="h-5 w-5 text-foreground"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <h3 className="mt-3 font-display text-base font-semibold text-foreground">
                    {b.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-muted">{b.description}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* How it works */}
      <Section tone="muted" size="md">
        <Container>
          <SectionHeading
            eyebrow="Как запускаем"
            title="4 шага до работающего ассистента"
            description="От первой встречи до боевого запуска — 3 рабочих дня."
          />
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {how.map((step) => (
              <li
                key={step.id}
                className="rounded-xl border border-border bg-background p-5"
              >
                <div className="font-display text-2xl font-semibold tabular-nums text-accent-ink">
                  <span className="rounded-md bg-accent px-2 py-0.5">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-ink-muted">{step.description}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <FinalCTA />
    </>
  );
}
