/**
 * FaqSection — accordion из shadcn. Берём первые 5 элементов FAQ.
 * Полная страница — /faq.
 */
import { Link } from "@tanstack/react-router";
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useFaq } from "@/lib/hooks/use-landing";

export function FaqSection() {
  const { data: faq = [] } = useFaq();
  const items = faq.slice(0, 6);

  return (
    <Section tone="default" size="md">
      <Container>
        <SectionHeading
          eyebrow="FAQ"
          title="Что обычно спрашивают"
          align="left"
        />

        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-8">
            <Accordion type="single" collapsible className="rounded-xl border border-border bg-surface">
              {items.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border-border px-5 last:border-b-0">
                  <AccordionTrigger className="py-4 text-left text-[15px] font-medium hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm text-ink-muted">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <aside className="md:col-span-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="font-display text-lg font-semibold text-foreground">
                Не нашли ответ?
                               </div>
              <p className="mt-2 text-sm text-ink-muted">
                Напишите в Telegram, отвечаем в течение 30 минут в рабочее время.
                               </p>
              <div className="mt-4 space-y-2 text-sm">
                <a
                  className="block font-medium text-foreground underline-offset-4 hover:underline"
                  href="https://t.me/botme_support"
                >
                  @botme_support →
                                   </a>
                <Link
                  to="/"
                  className="block text-ink-muted underline-offset-4 hover:text-foreground hover:underline"
                >
                  Все вопросы и категории →
                                   </Link>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
