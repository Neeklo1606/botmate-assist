/**
 * /scenarios — список 6 ниш с метриками.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { useScenarioDetails } from "@/lib/hooks/use-marketing";
import { FinalCTA } from "@/components/landing/sections/final-cta";

export const Route = createFileRoute("/_marketing/scenarios")({
  head: () => ({
    meta: [
      { title: "Сценарии под нишу — botme" },
      {
        name: "description",
        content:
          "AI-ассистент для недвижимости, авто, клиник, онлайн-школ, услуг и агентств. Готовые сценарии под каждую нишу.",
      },
      { property: "og:title", content: "Сценарии под нишу — botme" },
      {
        property: "og:description",
        content: "6 готовых сценариев AI-ассистента под индустрию.",
      },
    ],
  }),
  component: ScenariosPage,
});

function ScenariosPage() {
  const { data: scenarios = [], isLoading } = useScenarioDetails();
  const real = scenarios.filter((s) => s.niche !== "other");

  return (
    <>
      <Section size="lg">
        <Container>
          <div className="mx-auto max-w-[820px] text-center">
            <div className="mb-4 inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Сценарии
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] md:text-[56px] md:leading-[1.05]">
              Готовые сценарии под вашу нишу
            </h1>
            <p className="mt-5 text-base text-ink-muted md:text-lg">
              Не «универсальный бот» — а ассистент, заточенный под специфику вашего
              бизнеса. Знает, какие вопросы задавать и когда передавать менеджеру.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="muted" size="md">
        <Container>
          <SectionHeading
            eyebrow="Ниши"
            title="6 сценариев с детальной механикой"
          />
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[260px] animate-pulse rounded-xl border border-border bg-background"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {real.map((s) => (
                <article
                  key={s.niche}
                  className="group flex flex-col rounded-xl border border-border bg-background p-6 transition-colors hover:border-border-strong"
                >
                  <div className="text-xs uppercase tracking-wide text-ink-subtle">
                    {s.industry}
                  </div>
                  <h3 className="mt-2 font-display text-xl font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    {s.pain}
                  </p>

                  <ul className="mt-5 space-y-1.5 border-t border-border pt-5 text-sm text-foreground">
                    {s.tasks.slice(0, 3).map((t) => (
                      <li key={t} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-accent" />
                        {t}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <Button asChild variant="ghostInk" size="sm">
                      <Link to="/scenarios/$niche" params={{ niche: s.niche }}>
                        Подробнее
                        <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-10 rounded-xl border border-border-strong bg-background p-6 text-center">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Не нашли свою нишу?
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
              Команда neeklo соберёт ассистента под любой бизнес — от логистики до
              b2b SaaS. Запуск 5–7 дней.
            </p>
            <Button asChild variant="brand" size="md" className="mt-4">
              <Link to="/contacts">Обсудить вашу нишу</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </>
  );
}
