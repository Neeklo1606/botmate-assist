/**
 * MediaFaq — 6 вопросов в dark accordion.
 */
import { motion } from "framer-motion";
import { Container } from "@/components/layout/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ease = [0.2, 0.8, 0.2, 1] as const;

const ITEMS = [
  {
    q: "Чем Медиа отличается от ChatGPT и Midjourney?",
    a: "Botme собирает связку «текст + визуал + бренд» в одном потоке. ChatGPT не умеет в обложки, Midjourney не знает твой прайс. Студия знает и то, и другое.",
  },
  {
    q: "Где берёт визуалы?",
    a: "Через GPT-Image и собственные шаблоны под бренд. Можешь загрузить свои фото и стиль, и студия будет генерировать в твоей эстетике.",
  },
  {
    q: "Можно вести Telegram-канал?",
    a: "Да. Можно публиковать прямо в Telegram, VK и Instagram. Для ТГ-каналов есть отдельный формат «лонгрид» с разметкой.",
  },
  {
    q: "Что с авторскими правами на контент?",
    a: "Весь сгенерированный контент принадлежит тебе. Никаких водяных знаков botme в публикациях нет.",
  },
  {
    q: "Можно ли учить под бренд?",
    a: "Да. Загружаешь 5 10 примеров своих публикаций, студия учится на твоём голосе и tone of voice.",
  },
  {
    q: "Если результат не нравится?",
    a: "Регенерируешь сколько нужно. На каждый промт студия выдаёт 5 вариантов сразу. Не подходит — переформулируй промт.",
  },
];

export function MediaFaq() {
  return (
    <section className="py-20 lg:py-32" style={{ background: "var(--bg-elevated)" }}>
      <Container size="wide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease }}
          className="mx-auto max-w-[720px] text-center"
        >
          <div className="inline-flex items-center gap-2 font-mono text-[12px]" style={{ color: "var(--ink-dark-muted)" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            Вопросы
          </div>
          <h2 className="mt-4 font-display font-semibold text-[36px] lg:text-[48px]"
            style={{ color: "var(--ink-dark)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Что чаще спрашивают про Медиа.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease }}
          className="mx-auto mt-12 max-w-[720px]"
        >
          <Accordion type="single" collapsible className="w-full">
            {ITEMS.map((it, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b"
                style={{ borderColor: "var(--border-dark)" }}
              >
                <AccordionTrigger
                  className="py-6 text-left font-display text-[16px] font-medium hover:no-underline"
                  style={{ color: "var(--ink-dark)" }}
                >
                  {it.q}
                </AccordionTrigger>
                <AccordionContent
                  className="pb-6 text-[14px]"
                  style={{ color: "var(--ink-dark-muted)", lineHeight: 1.6 }}
                >
                  <p className="max-w-[600px]">{it.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </Container>
    </section>
  );
}
