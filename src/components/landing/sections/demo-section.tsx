/**
 * DemoSection — тёмная секция с формой заявки и mock-чатом.
 * Один из двух dark-блоков на странице.
 */
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { DemoForm } from "@/components/landing/demo-form";
import { MockChat } from "@/components/landing/mock-chat";
import { useHeroChat } from "@/lib/hooks/use-landing";

export function DemoSection() {
  const { data: messages = [] } = useHeroChat();

  return (
    <Section id="demo" tone="ink" size="md">
      <Container>
        <div className="grid items-start gap-10 md:grid-cols-2 md:gap-14">
          <div className="text-background">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/5 px-3 py-1 text-xs font-medium text-background/70">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              Демо за 30 минут
                           </div>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              Покажем ассистента на ваших данных
                           </h2>
            <p className="mt-3 text-[15px] text-background/70 md:text-base">
              Оставьте контакт, соберём прототип под вашу нишу за 30 минут и созвонимся
                           в Zoom. Без презентаций и обещаний «революции».
                           </p>

            <div className="mt-6 hidden md:block">
              <MockChat
                title="Демо для вашей ниши"
                subtitle="Парус · Недвижимость"
                messages={messages.slice(0, 4)}
                variant="dark"
              />
            </div>
          </div>

          <DemoForm source="landing" variant="dark" ctaLabel="Получить демо" />
        </div>
      </Container>
    </Section>
  );
}
