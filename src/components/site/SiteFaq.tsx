/**
 * SiteFaq — 6 вопросов в dark accordion.
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
    q: "Чем это отличается от Tilda и Tilda+ChatGPT?",
    a: "В Tilda ты сам собираешь блоки. Здесь — рассказываешь о бизнесе, остальное делает botme. Готовый сайт за 30 минут вместо 30 часов.",
  },
  {
    q: "Можно использовать свой домен?",
    a: "Да, на тарифе Бизнес и выше. Привязка через DNS — даём инструкцию, занимает 10 минут. Если нет домена — зарегистрируем и привяжем.",
  },
  {
    q: "Кто хостит сайт?",
    a: "Серверы botme в РФ. Сайт работает на нашей инфраструктуре, ты не платишь за хостинг отдельно. SLA 99.9% для тарифа Бизнес и выше.",
  },
  {
    q: "Куда летят заявки с формы?",
    a: "В Telegram, на email, в amoCRM, Bitrix24, Google Sheets. Можешь подключить webhook и отправлять куда угодно.",
  },
  {
    q: "Можно сделать сайт на английском?",
    a: "Да. Любой язык. Botme понимает контекст и адаптирует тексты под рынок.",
  },
  {
    q: "Если нужна кастомизация дизайна сильнее, чем в редакторе?",
    a: "Тариф Студия даёт доступ к ручному коду секций. Или закажи ручную доработку у команды neeklo — это отдельный сервис.",
  },
];

export function SiteFaq() {
  return (
    <section className="py-20 lg:py-32" style={{ background: "var(--bg-base)" }}>
      <Container size="wide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease }}
          className="mx-auto max-w-[720px] text-center"
        >
          <div
            className="inline-flex items-center gap-2 font-mono text-[12px]"
            style={{ color: "var(--ink-dark-muted)" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--accent)" }}
            />
            Вопросы
          </div>
          <h2
            className="mt-4 font-display font-semibold text-[36px] lg:text-[48px]"
            style={{
              color: "var(--ink-dark)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Что чаще спрашивают про Сайт.
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
