/**
 * SiteHowItWorks — 4 шага механики.
 */
import { motion } from "framer-motion";
import { Briefcase, Sparkles, Edit3, Globe, type LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/container";

const ease = [0.2, 0.8, 0.2, 1] as const;

interface Step {
  n: string;
  Icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    n: "01",
    Icon: Briefcase,
    title: "Заполни бриф",
    body: "7 вопросов про твой бизнес и аудиторию. Без технических деталей.",
  },
  {
    n: "02",
    Icon: Sparkles,
    title: "Получи макет",
    body: "Botme генерирует структуру, тексты и визуалы за 2 минуты.",
  },
  {
    n: "03",
    Icon: Edit3,
    title: "Поправь под себя",
    body: "Меняй заголовки, цвета, добавляй секции. Drag-and-drop.",
  },
  {
    n: "04",
    Icon: Globe,
    title: "Опубликуй",
    body: "Жми «Опубликовать». Сайт работает на твоём поддомене .botme.app или собственном.",
  },
];

export function SiteHowItWorks() {
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
          <div
            className="inline-flex items-center gap-2 font-mono text-[12px]"
            style={{ color: "var(--ink-dark-muted)" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--accent)" }}
            />
            Как работает
          </div>
          <h2
            className="mt-4 font-display font-semibold text-[36px] lg:text-[52px]"
            style={{
              color: "var(--ink-dark)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Четыре шага. Никакого кода.
          </h2>
          <p
            className="mt-5 text-[16px] lg:text-[18px]"
            style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}
          >
            От пустой страницы до опубликованного лендинга — меньше получаса.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease, delay: i * 0.06 }}
              className="step-card group relative rounded-[16px] p-6"
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border-dark)",
              }}
            >
              <div
                className="step-num font-mono font-medium tabular-nums"
                style={{
                  color: "var(--ink-dark-subtle)",
                  fontSize: 56,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  transition: "color 200ms cubic-bezier(0.2,0.8,0.2,1)",
                }}
              >
                {s.n}
              </div>
              <s.Icon
                className="mt-3 h-[18px] w-[18px]"
                strokeWidth={1.75}
                style={{ color: "var(--ink-dark-muted)" }}
              />
              <h3
                className="mt-4 font-display text-[18px] font-semibold"
                style={{ color: "var(--ink-dark)" }}
              >
                {s.title}
              </h3>
              <p
                className="mt-1.5 text-[13px]"
                style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}
              >
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
      <style>{`
        .step-card:hover .step-num { color: var(--accent) !important; }
      `}</style>
    </section>
  );
}
