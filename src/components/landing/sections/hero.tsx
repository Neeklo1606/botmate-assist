/**
 * Hero — главный экран лендинга.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { MockChat } from "@/components/landing/mock-chat";
import { Reveal } from "@/components/motion/reveal";
import { useHeroChat } from "@/lib/hooks/use-landing";
import { track } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/locale";

export function Hero() {
  const { data: messages = [] } = useHeroChat();
  const { t } = useLocale();

  return (
    <section className="relative overflow-hidden bg-background pb-12 pt-10 md:pb-20 md:pt-16">
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-12 md:gap-12">
          <Reveal onMount delay={0.1} className="md:col-span-6 lg:col-span-7">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              {t("hero.badge")}
            </div>

            <h1 className="font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground md:text-[56px]">
              {t("hero.titleA")}
              <br className="hidden sm:inline" /> {t("hero.titleB")}{" "}
              <span className="rounded-md bg-accent px-2 text-accent-ink">
                {t("hero.titleHighlight")}
              </span>{" "}
              {t("hero.titleC")}
            </h1>

            <p className="mt-5 max-w-[560px] text-[15px] text-ink-muted md:text-[17px]">
              {t("hero.subtitle")}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild variant="brand" size="lg">
                <Link
                  to="/"
                  hash="demo"
                  onClick={() => track("cta-click", { location: "hero", intent: "demo" })}
                >
                  {t("cta.launch3")}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link
                  to="/"
                  hash="how"
                  onClick={() => track("cta-click", { location: "hero", intent: "how" })}
                >
                  {t("cta.howItWorks")}
                </Link>
              </Button>
            </div>

            <dl className="mt-10 grid max-w-[520px] grid-cols-3 gap-4 border-t border-border pt-6 sm:gap-6">
              <Stat label={t("hero.statResponse")} value={t("hero.statResponseValue")} />
              <Stat label={t("hero.statConv")} value={t("hero.statConvValue")} />
              <Stat label={t("hero.statLaunch")} value={t("hero.statLaunchValue")} />
            </dl>
          </Reveal>

          <Reveal onMount delay={0.25} className="md:col-span-6 lg:col-span-5">
            <div className="relative">
              <div aria-hidden className="absolute -inset-3 -z-10 rounded-2xl bg-surface-muted" />
              <MockChat messages={messages} />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-subtle">{label}</dt>
      <dd className="mt-1 font-display text-[22px] font-semibold tabular text-foreground">
        {value}
      </dd>
    </div>
  );
}
