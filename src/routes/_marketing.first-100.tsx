/**
 * /first-100 — программа «Первые 100 клиентов».
 * Цель: одна страница, один оффер, одно действие.
 * Дата-driven через useFirst100Stats / useFirst100Benefits / useFirst100Math.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wrench,
  Percent,
  User,
  Sparkles,
  ArrowRight,
  Check,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DemoForm } from "@/components/landing/demo-form";
import {
  useFirst100Benefits,
  useFirst100Math,
  useFirst100Stats,
} from "@/lib/hooks/use-first100";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_marketing/first-100")({
  head: () => ({
    meta: [
      { title: "Первые 100 клиентов botme — настройка под ключ за 150 000 ₽" },
      {
        name: "description",
        content:
          "Команда neeklo собирает ассистента руками, Pro-подписка со скидкой 40% навсегда. Только для первых 100 клиентов.",
      },
      { property: "og:title", content: "Программа «Первые 100 клиентов» botme" },
      {
        property: "og:description",
        content: "Настройка под ключ за 150 000 ₽. Pro-подписка −40% навсегда.",
      },
    ],
  }),
  component: First100Page,
});

const iconMap: Record<string, LucideIcon> = {
  Wrench,
  Percent,
  User,
  Sparkles,
};

const targetAudience = [
  "Малый бизнес в РФ или СНГ",
  "Уже есть входящий поток 30+ обращений в месяц",
  "Готов вложиться в автоматизацию один раз и надолго",
  "Ниши: недвижимость, авто, клиники, услуги, онлайн-школы, агентства",
];

const programFaq = [
  {
    id: "f1",
    question: "Что если не подойдёт?",
    answer:
      "Возврат 100% в первые 14 дней. Без вопросов. Дальше — работа по договору.",
  },
  {
    id: "f2",
    question: "Сколько времени займёт настройка?",
    answer:
      "От 3 до 5 рабочих дней с момента, когда вы дадите доступы к каналам и базе знаний.",
  },
  {
    id: "f3",
    question: "Когда закончится скидка?",
    answer:
      "Когда наберём 100 клиентов в программе. Если попали — цена не меняется, пока вы клиент.",
  },
  {
    id: "f4",
    question: "Можно ли платить частями?",
    answer:
      "Да: 50% предоплата, 50% после запуска и приёмки. По договору, на юрлицо или ИП.",
  },
];

function First100Page() {
  return (
    <>
      <First100Hero />
      <First100Benefits />
      <First100Math />
      <First100Audience />
      <First100Faq />
      <First100Final />
    </>
  );
}

function First100Hero() {
  const { data: stats } = useFirst100Stats();
  const taken = stats?.taken ?? 0;
  const total = stats?.total ?? 100;
  const percent = Math.min(100, Math.round((taken / total) * 100));
  const left = Math.max(0, total - taken);

  return (
    <section className="bg-background pb-12 pt-10 md:pb-16 md:pt-14">
      <Container>
        <div className="grid items-start gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-ink">
              Программа для первых 100 клиентов
            </div>
            <h1 className="font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground md:text-[52px]">
              Соберём вашего ассистента руками. За{" "}
              <span className="tabular">150 000 ₽</span> один раз.
            </h1>
            <p className="mt-5 max-w-[560px] text-[15px] text-ink-muted md:text-[17px]">
              Команда neeklo настраивает ассистента под ваш бизнес лично. Pro-подписка
              навсегда со скидкой 40%. Только для первых 100 клиентов.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild variant="brand" size="lg">
                <a href="#book">
                  Забронировать место
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/pricing">Посмотреть тарифы</Link>
              </Button>
            </div>
          </div>

          <aside className="md:col-span-5">
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
                Места в программе
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <div className="font-display text-[44px] font-semibold tabular leading-none text-foreground">
                  {left}
                </div>
                <div className="text-sm text-ink-muted">
                  из <span className="tabular">{total}</span> осталось
                </div>
              </div>

              <div
                className="mt-5 h-2 w-full overflow-hidden rounded-full bg-surface-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-label="Заполнение программы"
              >
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-ink-subtle">
                <span>Занято: {taken}</span>
                <span className="tabular">{percent}%</span>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}

function First100Benefits() {
  const { data: benefits = [] } = useFirst100Benefits();

  return (
    <Section tone="muted" size="md">
      <Container>
        <SectionHeading
          eyebrow="Что входит"
          title="Не подписка, а полноценный запуск под ключ"
          description="Не «дадим вам инструменты», а «соберём ассистента сами». Вы получаете рабочий продукт через 3–5 дней."
        />
        <div className="grid gap-3 md:grid-cols-2">
          {benefits.map((b) => {
            const Icon = iconMap[b.icon] ?? Sparkles;
            return (
              <div
                key={b.id}
                className="flex gap-4 rounded-xl border border-border bg-surface p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-display text-lg font-semibold text-foreground">
                    {b.title}
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{b.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

function First100Math() {
  const { data: rows = [] } = useFirst100Math();

  return (
    <Section tone="default" size="md">
      <Container>
        <SectionHeading
          eyebrow="Математика оффера"
          title="Сколько вы экономите за первый год"
          description="После 100 клиентов цены вернутся к стандартным. Сейчас — окно для тех, кто готов работать с нами вдолгую."
        />

        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-3 bg-surface-muted px-5 py-3 text-xs font-medium uppercase tracking-wide text-ink-muted">
            <div>Что</div>
            <div>После 100 клиентов</div>
            <div className="relative">
              Сейчас для вас
              <span className="ml-2 inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-accent-ink">
                лучшая цена
              </span>
            </div>
          </div>

          <div className="divide-y divide-border bg-surface">
            {rows.map((row, idx) => (
              <div
                key={row.feature}
                className={cn(
                  "grid grid-cols-3 items-center px-5 py-4 text-sm",
                  idx === rows.length - 1 && "bg-surface-muted/40 font-medium",
                )}
              >
                <div className="text-foreground">{row.feature}</div>
                <div className="tabular text-ink-muted line-through decoration-ink-subtle">
                  {row.regular}
                </div>
                <div className="tabular font-semibold text-foreground">{row.now}</div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

function First100Audience() {
  return (
    <Section tone="muted" size="md">
      <Container>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <SectionHeading
              eyebrow="Для кого"
              title="Программа подойдёт, если"
              description="Мы не берём всех. Берём тех, кому реально окупится."
            />
          </div>
          <ul className="md:col-span-7 grid gap-3 self-start">
            {targetAudience.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent text-accent-ink">
                  <Check className="h-3.5 w-3.5" strokeWidth={2} />
                </div>
                <span className="text-[15px] text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

function First100Faq() {
  return (
    <Section tone="default" size="md">
      <Container>
        <SectionHeading eyebrow="Частые вопросы" title="Что обычно спрашивают про программу" />

        <Accordion
          type="single"
          collapsible
          className="rounded-xl border border-border bg-surface"
        >
          {programFaq.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border-border px-5 last:border-b-0"
            >
              <AccordionTrigger className="py-4 text-left text-[15px] font-medium hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm text-ink-muted">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </Section>
  );
}

function First100Final() {
  return (
    <Section id="book" tone="ink" size="md">
      <Container>
        <div className="grid items-start gap-10 md:grid-cols-2">
          <div className="text-background">
            <div className="mb-3 inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-ink">
              Заявка в программу
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              Заберите место — пока есть свободные
            </h2>
            <p className="mt-4 text-[15px] text-background/70 md:text-base">
              Менеджер свяжется в течение 30 минут в рабочее время, обсудит вашу нишу
              и закрепит за вами место в программе.
            </p>

            <div className="mt-6 space-y-2 text-sm text-background/80">
              <Bullet>Возврат 100% в первые 14 дней</Bullet>
              <Bullet>Договор и оплата на ИП или юрлицо</Bullet>
              <Bullet>Приёмка после запуска — без скрытых условий</Bullet>
            </div>
          </div>

          <DemoForm
            source="first-100"
            variant="dark"
            ctaLabel="Хочу в программу первых 100"
          />
        </div>
      </Container>
    </Section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
      <span>{children}</span>
    </div>
  );
}
