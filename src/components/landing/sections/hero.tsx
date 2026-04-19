/**
 * Hero — главный экран лендинга.
 * H1 с lime-акцентом на ключевое слово. Mock-чат справа.
 * 2 CTA: brand + outline. Мобильный stack.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { MockChat } from "@/components/landing/mock-chat";
import { useHeroChat } from "@/lib/hooks/use-landing";

export function Hero() {
  const { data: messages = [] } = useHeroChat();

  return (
    <section className="relative overflow-hidden bg-background pb-12 pt-10 md:pb-20 md:pt-16">
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-6 lg:col-span-7">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              Запуск за 3 дня · все каналы · CRM из коробки
            </div>

            <h1 className="font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground md:text-[56px]">
              AI-ассистент,
              <br className="hidden sm:inline" /> который{" "}
              <span className="rounded-md bg-accent px-2 text-accent-ink">не теряет</span> ваших
              клиентов
            </h1>

            <p className="mt-5 max-w-[560px] text-[15px] text-ink-muted md:text-[17px]">
              Отвечает за 7 секунд в Telegram, на сайте, в Avito. Квалифицирует лида, записывает в
              CRM, доводит до сделки. Без выгорания, ночью и в выходные.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild variant="brand" size="lg">
                <Link to="/" hash="demo">
                  Запустить за 3 дня
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/" hash="how">
                  Как это работает
                </Link>
              </Button>
            </div>

            <dl className="mt-10 grid max-w-[520px] grid-cols-3 gap-6 border-t border-border pt-6">
              <Stat label="Среднее время ответа" value="7 сек" />
              <Stat label="Конверсия в лид" value="+38%" />
              <Stat label="Запуск" value="3 дня" />
            </dl>
          </div>

          <div className="md:col-span-6 lg:col-span-5">
            <div className="relative">
              <div aria-hidden className="absolute -inset-3 -z-10 rounded-2xl bg-surface-muted" />
              <MockChat messages={messages} />
            </div>
          </div>
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
