/**
 * /about — о команде botme.
 * Hero + миссия + команда + CTA.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { useTeamPeople } from "@/lib/hooks/use-marketing";
import { FinalCTA } from "@/components/landing/sections/final-cta";

export const Route = createFileRoute("/_marketing/about")({
  head: () => ({
    meta: [
      { title: "О команде — botme" },
      {
        name: "description",
        content:
          "botme — продукт студии neeklo. Команда из 4 человек, которая делает AI-ассистенты для бизнеса с 2025 года.",
      },
      { property: "og:title", content: "О команде — botme" },
      {
        property: "og:description",
        content: "Кто стоит за botme и зачем мы это делаем.",
      },
    ],
  }),
  component: AboutPage,
});

const PRINCIPLES = [
  {
    title: "Никаких выдуманных метрик",
    description:
      "Мы показываем реальные цифры клиентов — не «до 10 раз быстрее», а «8 секунд вместо 12 минут».",
  },
  {
    title: "Запуск важнее красивого MVP",
    description:
      "Лучше работающий ассистент за 3 дня, чем «идеальный» через 3 месяца. Допиливаем после боевого старта.",
  },
  {
    title: "Один продукт на всех",
    description:
      "Никаких «отдельных версий». Что есть в Pro — будет в Pro. Что обещали — то и сделаем.",
  },
];

function AboutPage() {
  const { data: team = [] } = useTeamPeople();

  return (
    <>
      <Section size="lg">
        <Container>
          <div className="mx-auto max-w-[820px] text-center">
            <div className="mb-4 inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              О команде
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] md:text-[56px] md:leading-[1.05]">
              Делаем AI-ассистенты, которые приносят выручку
            </h1>
            <p className="mt-5 text-base text-ink-muted md:text-lg">
              botme — продукт студии neeklo.studio. Мы строим инструменты, которые экономят бизнесу
              часы и деньги. Без волшебства — на проверенных технологиях.
            </p>
          </div>
        </Container>
      </Section>

      {/* Principles */}
      <Section tone="muted" size="md">
        <Container>
          <SectionHeading
            eyebrow="Принципы"
            title="Что мы считаем правильным"
            description="Если эти принципы не подходят вашему бизнесу — мы не подойдём друг другу."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <article key={p.title} className="rounded-xl border border-border bg-background p-6">
                <div className="font-display text-2xl font-semibold tabular-nums text-accent-ink">
                  <span className="rounded-md bg-accent px-2 py-0.5">0{i + 1}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{p.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* Team */}
      <Section size="md">
        <Container>
          <SectionHeading
            eyebrow="Команда"
            title="4 человека, которые лично запускают ваш ассистент"
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {team.map((p) => (
              <article key={p.id} className="rounded-xl border border-border bg-surface p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground font-display text-lg font-semibold text-background">
                  {p.initials}
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                  {p.name}
                </h3>
                <div className="text-xs uppercase tracking-wide text-ink-subtle">{p.role}</div>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{p.bio}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-border-strong bg-surface p-8 text-center">
            <h3 className="font-display text-xl font-semibold text-foreground">
              Хотите познакомиться?
            </h3>
            <p className="max-w-md text-sm text-ink-muted">
              Расскажите о бизнесе — за 30 минут покажем, как ассистент будет работать именно у вас.
            </p>
            <Button asChild variant="brand" size="lg" className="mt-2">
              <Link to="/" hash="demo">
                Запланировать демо
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </Button>
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </>
  );
}
