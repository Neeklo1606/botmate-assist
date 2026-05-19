/**
 * /faq — частые вопросы, accordion с группировкой по категориям.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useFaq } from "@/lib/hooks/use-landing";
import { repository } from "@/lib/mock/repository";
import { FinalCTA } from "@/components/landing/sections/final-cta";
import { cn } from "@/lib/utils";
import type { FaqItem } from "@/types/entities";

const CATEGORIES: { id: FaqItem["category"] | "all"; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "general", label: "Общее" },
  { id: "pricing", label: "Тарифы" },
  { id: "tech", label: "Технологии" },
  { id: "integrations", label: "Интеграции" },
  { id: "security", label: "Безопасность" },
];

import { buildPageMeta, canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/faq")({
  loader: async () => {
    const items = await repository.listFaq();
    return { items };
  },
  head: ({ loaderData }) => ({
    meta: buildPageMeta({
      title: "FAQ botme — частые вопросы о AI-ассистенте",
      description:
        "Ответы на вопросы о запуске, ценах, технологиях, интеграциях и безопасности данных. Что нужно знать до старта работы с AI-ассистентом botme.",
      path: "/faq",
    }),
    links: [canonicalLink("/faq")],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: (loaderData?.items ?? []).map((it) => ({
            "@type": "Question",
            name: it.question,
            acceptedAnswer: { "@type": "Answer", text: it.answer },
          })),
        }),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { data: items = [] } = useFaq();
  const [active, setActive] = useState<FaqItem["category"] | "all">("all");

  const filtered = useMemo(
    () => (active === "all" ? items : items.filter((i) => i.category === active)),
    [active, items],
  );

  return (
    <>
      <Section size="lg">
        <Container>
          <div className="mx-auto max-w-[820px] text-center">
            <div className="mb-4 inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              FAQ
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] md:text-[56px] md:leading-[1.05]">
              Что обычно спрашивают
            </h1>
            <p className="mt-5 text-base text-ink-muted md:text-lg">
              Если ответа нет, напишите в Telegram, разберёмся.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="muted" size="md">
        <Container>
          <SectionHeading eyebrow="Категории" title="Выберите тему" />
          <div className="mb-6 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  active === c.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-surface",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-background">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-muted">
                В этой категории пока нет вопросов.
              </div>
            ) : (
              <Accordion type="single" collapsible className="divide-y divide-border">
                {filtered.map((item) => (
                  <AccordionItem key={item.id} value={item.id} className="border-b-0 px-5">
                    <AccordionTrigger className="text-left font-display text-base font-semibold text-foreground hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-[15px] leading-relaxed text-ink-muted">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          <div className="mt-10 rounded-xl border border-border-strong bg-background p-6 text-center">
            <h3 className="font-display text-lg font-semibold text-foreground">Не нашли ответа?</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
              Напишите в Telegram-поддержку или оставьте контакт. Менеджер свяжется в течение часа.
            </p>
            <Button asChild variant="brand" size="md" className="mt-4">
              <Link to="/contacts">Связаться</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </>
  );
}
