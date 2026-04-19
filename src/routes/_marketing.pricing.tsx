/**
 * /pricing — подробная страница тарифов.
 * Hero + переключатель Месяц/Год → 3 plan-карточки → таблица сравнения →
 * Enterprise-блок → FAQ по тарифам → финальный CTA.
 */
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { usePricing, usePricingComparison } from "@/lib/hooks/use-landing";
import { formatRub } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PricingPlan, PricingPeriod } from "@/types/entities";

export const Route = createFileRoute("/_marketing/pricing")({
  head: () => ({
    meta: [
      { title: "Тарифы botme — от 4 900 ₽ в месяц, без сюрпризов" },
      {
        name: "description",
        content:
          "Старт, Рост и Масштаб. Понятные тарифы, без скрытых платежей. Возврат в первые 14 дней.",
      },
      { property: "og:title", content: "Тарифы botme — от 4 900 ₽ в месяц" },
      {
        property: "og:description",
        content: "3 тарифа на любой объём бизнеса. Возврат 100% в первые 14 дней.",
      },
    ],
  }),
  component: PricingPage,
});

const pricingFaq = [
  {
    id: "p1",
    question: "Можно ли вернуть деньги?",
    answer:
      "Да, в первые 14 дней — возврат 100%. Без вопросов и формуляров. После — по договору.",
  },
  {
    id: "p2",
    question: "Что считается «диалогом»?",
    answer:
      "Один уникальный клиент в течение 24 часов = 1 диалог. Сколько бы сообщений он ни прислал.",
  },
  {
    id: "p3",
    question: "Можно ли менять тариф?",
    answer:
      "Да, в любой момент. Апгрейд — мгновенно с прорейтом. Даунгрейд — со следующего периода.",
  },
  {
    id: "p4",
    question: "Какие способы оплаты?",
    answer:
      "Карта (физлицо) или счёт на ИП/ООО с НДС или без. Оплата в рублях, без подписок и автосписаний.",
  },
  {
    id: "p5",
    question: "Что если не вписываюсь в лимит сообщений?",
    answer:
      "Предупредим за неделю. Можно докупить пакет или перейти на следующий тариф — по вашему выбору.",
  },
];

function PricingPage() {
  const [period, setPeriod] = useState<PricingPeriod>("monthly");

  return (
    <>
      <PricingHero period={period} onChange={setPeriod} />
      <PricingPlans period={period} />
      <PricingComparison />
      <EnterpriseBlock />
      <PricingFaq />
      <PricingFinal />
    </>
  );
}

function PricingHero({
  period,
  onChange,
}: {
  period: PricingPeriod;
  onChange: (p: PricingPeriod) => void;
}) {
  return (
    <section className="bg-background pb-10 pt-12 md:pb-12 md:pt-16">
      <Container>
        <div className="mx-auto max-w-[680px] text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Возврат 100% в первые 14 дней
          </div>
          <h1 className="font-display text-[36px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground md:text-[52px]">
            Понятные тарифы. Без сюрпризов.
          </h1>
          <p className="mt-4 text-[15px] text-ink-muted md:text-base">
            Платите за работу ассистента — не за «лицензии», «места» и «места хранения».
          </p>

          <div className="mt-7 inline-flex items-center rounded-full border border-border bg-surface p-1 text-sm">
            <PeriodToggle
              active={period === "monthly"}
              onClick={() => onChange("monthly")}
            >
              Месяц
            </PeriodToggle>
            <PeriodToggle
              active={period === "yearly"}
              onClick={() => onChange("yearly")}
            >
              Год
              <span className="ml-1.5 inline-flex items-center rounded-sm bg-accent px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent-ink">
                −15%
              </span>
            </PeriodToggle>
          </div>
        </div>
      </Container>
    </section>
  );
}

function PeriodToggle({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-ink-muted hover:text-foreground",
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function PricingPlans({ period }: { period: PricingPeriod }) {
  const { data: plans = [] } = usePricing();

  return (
    <Section tone="default" size="sm">
      <Container>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} period={period} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

function PlanCard({ plan, period }: { plan: PricingPlan; period: PricingPeriod }) {
  const discount = plan.yearlyDiscount ?? 0;
  const monthly =
    period === "yearly"
      ? Math.round((plan.priceRub * (1 - discount)) / 100) * 100
      : plan.priceRub;

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-xl border bg-surface p-6",
        plan.highlighted ? "border-accent shadow-lift" : "border-border",
      )}
    >
      {plan.highlighted ? (
        <div className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-ink">
          Хит
        </div>
      ) : null}

      <div className="font-display text-xl font-semibold text-foreground">{plan.name}</div>
      <p className="mt-1 text-sm text-ink-muted">{plan.tagline}</p>

      <div className="mt-5">
        <div className="flex items-baseline gap-1.5">
          <div className="font-display text-3xl font-semibold tabular text-foreground">
            {formatRub(monthly)}
          </div>
          <div className="text-sm text-ink-muted">/ мес</div>
        </div>
        {period === "yearly" ? (
          <div className="mt-1 text-xs text-ink-subtle">
            при оплате за год · экономия {Math.round(discount * 100)}%
          </div>
        ) : null}
      </div>

      <p className="mt-4 rounded-md bg-surface-muted px-3 py-2 text-xs text-ink-muted">
        {plan.forWho}
      </p>

      <ul className="mt-5 space-y-2.5">
        {plan.features.map((feat) => (
          <li key={feat} className="flex gap-2 text-sm text-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" strokeWidth={1.5} />
            <span>{feat}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 pt-4">
        <Button
          asChild
          variant={plan.cta.intent === "primary" ? "brand" : "outline"}
          size="md"
          className="w-full"
        >
          <Link to="/" hash="demo">
            {plan.cta.label}
          </Link>
        </Button>
      </div>
    </article>
  );
}

function PricingComparison() {
  const { data: rows = [] } = usePricingComparison();

  const renderCell = (val: string) => {
    if (val === "—") {
      return <Minus className="h-4 w-4 text-ink-subtle" strokeWidth={1.5} />;
    }
    if (val === "✓") {
      return <Check className="h-4 w-4 text-foreground" strokeWidth={1.5} />;
    }
    return <span className="text-sm text-foreground tabular">{val}</span>;
  };

  return (
    <Section tone="muted" size="md">
      <Container>
        <SectionHeading eyebrow="Сравнение" title="Что входит в каждый тариф" />

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
          <div className="grid grid-cols-4 bg-surface-muted px-6 py-4 text-xs font-medium uppercase tracking-wide text-ink-muted">
            <div>Возможность</div>
            <div>Старт</div>
            <div className="flex items-center gap-2">
              Рост
              <span className="rounded-sm bg-accent px-1.5 py-0.5 text-[10px] tracking-normal text-accent-ink">
                Хит
              </span>
            </div>
            <div>Масштаб</div>
          </div>
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <div key={row.feature} className="grid grid-cols-4 items-center px-6 py-3.5">
                <div className="text-sm text-foreground">{row.feature}</div>
                <div>{renderCell(row.values.start)}</div>
                <div>{renderCell(row.values.pro)}</div>
                <div>{renderCell(row.values.max)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile tabs */}
        <Tabs defaultValue="pro" className="md:hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="start">Старт</TabsTrigger>
            <TabsTrigger value="pro">Рост</TabsTrigger>
            <TabsTrigger value="max">Масштаб</TabsTrigger>
          </TabsList>
          {(["start", "pro", "max"] as const).map((tab) => (
            <TabsContent
              key={tab}
              value={tab}
              className="mt-4 overflow-hidden rounded-xl border border-border bg-surface"
            >
              <ul className="divide-y divide-border">
                {rows.map((row) => (
                  <li key={row.feature} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-sm text-foreground">{row.feature}</span>
                    <span className="shrink-0">{renderCell(row.values[tab])}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
          ))}
        </Tabs>
      </Container>
    </Section>
  );
}

function EnterpriseBlock() {
  return (
    <Section tone="default" size="sm">
      <Container>
        <div className="rounded-2xl border border-border bg-surface-muted/60 p-8 md:p-10">
          <div className="grid gap-6 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-7">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
                Enterprise
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Нужно больше? Соберём индивидуальный пакет
              </h2>
              <p className="mt-3 text-[15px] text-ink-muted">
                Безлимит на ассистентов и диалоги, выделенный менеджер, on-premise опция,
                персональный SLA и интеграции с вашими системами.
              </p>
            </div>
            <div className="md:col-span-5 md:self-end">
              <ul className="grid gap-2 text-sm text-foreground">
                <EnterpriseLi>Выделенные серверы и on-premise</EnterpriseLi>
                <EnterpriseLi>SLA 99.95% с компенсацией</EnterpriseLi>
                <EnterpriseLi>Персональный аккаунт-менеджер</EnterpriseLi>
                <EnterpriseLi>White-label и кастомный домен</EnterpriseLi>
              </ul>
              <Button asChild variant="outline" size="md" className="mt-5">
                <Link to="/" hash="demo">
                  Обсудить Enterprise
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function EnterpriseLi({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" strokeWidth={1.5} />
      <span>{children}</span>
    </li>
  );
}

function PricingFaq() {
  return (
    <Section tone="muted" size="md">
      <Container>
        <SectionHeading eyebrow="FAQ по тарифам" title="Биллинг, лимиты и возвраты" />

        <Accordion
          type="single"
          collapsible
          className="rounded-xl border border-border bg-surface"
        >
          {pricingFaq.map((item) => (
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

function PricingFinal() {
  return (
    <Section tone="ink" size="md">
      <Container>
        <div className="mx-auto max-w-[680px] text-center text-background">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] md:text-[40px]">
            Не уверены, какой тариф нужен?
          </h2>
          <p className="mt-4 text-[15px] text-background/70 md:text-base">
            Покажем демо за 30 минут и подскажем, какой тариф окупится в вашей нише.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="signal" size="lg">
              <Link to="/" hash="demo">
                Получить демо
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </Button>
            <Button asChild variant="ink" size="lg">
              <Link to="/first-100">Программа «Первые 100»</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
