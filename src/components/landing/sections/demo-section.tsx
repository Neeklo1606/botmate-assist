/**
 * DemoSection — тёмная секция с формой заявки и mock-чатом.
 */
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { DemoForm } from "@/components/landing/demo-form";
import { MockChat } from "@/components/landing/mock-chat";
import { useHeroChat } from "@/lib/hooks/use-landing";
import { useLocale } from "@/lib/i18n/locale";

export function DemoSection() {
  const { data: messages = [] } = useHeroChat();
  const { t } = useLocale();

  return (
    <Section id="demo" tone="ink" size="md">
      <Container>
        <div className="grid items-start gap-10 md:grid-cols-2 md:gap-14">
          <div className="text-background">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/5 px-3 py-1 text-xs font-medium text-background/70">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              {t("demo.badge")}
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              {t("demo.title")}
            </h2>
            <p className="mt-3 text-[15px] text-background/70 md:text-base">{t("demo.desc")}</p>

            <div className="mt-6 hidden md:block">
              <MockChat
                title={t("demo.chatTitle")}
                subtitle={t("demo.chatSubtitle")}
                messages={messages.slice(0, 4)}
                variant="dark"
              />
            </div>
          </div>

          <DemoForm source="landing" variant="dark" ctaLabel={t("cta.getDemo")} />
        </div>
      </Container>
    </Section>
  );
}
