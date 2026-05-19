/**
 * HowItWorksHome — три универсальных шага использования botme.
 */
import { motion } from "framer-motion";
import { Container } from "@/components/layout/container";

const ease = [0.2, 0.8, 0.2, 1] as const;

const steps = [
  {
    n: "01",
    title: "Выбираешь продукт",
    body: "Ассистент, Медиа или Сайт. Можно начать с одного, добавить остальные позже.",
  },
  {
    n: "02",
    title: "Проходишь короткий бриф",
    body: "5–7 вопросов про твой бизнес. Без технических терминов.",
  },
  {
    n: "03",
    title: "Получаешь готовое",
    body: "Ассистент работает, контент сгенерирован, сайт опубликован. Всё в одном кабинете.",
  },
];

export function HowItWorksHome() {
  return (
    <section
      className="border-t py-20 lg:py-32"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border-dark)",
      }}
    >
      <Container size="wide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease }}
          className="max-w-[720px]"
        >
          <span
            className="inline-flex items-center rounded-full border px-3.5 py-1.5 text-[12px] font-mono"
            style={{
              background: "var(--bg-soft)",
              borderColor: "var(--border-dark)",
              color: "var(--ink-dark-muted)",
            }}
          >
            Как это работает
          </span>
          <h2
            className="mt-5 font-display font-semibold text-[32px] lg:text-[48px]"
            style={{
              color: "var(--ink-dark)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Три шага от регистрации до первого результата.
          </h2>
          <p
            className="mt-4 text-[16px] lg:text-[18px]"
            style={{ color: "var(--ink-dark-muted)" }}
          >
            Универсально для всех трёх продуктов. Минимум действий, максимум скорости.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease, delay: i * 0.08 }}
              className="step-card group rounded-[16px] border p-7"
              style={{
                background: "var(--bg-base)",
                borderColor: "var(--border-dark)",
              }}
            >
              <div
                className="step-num font-mono font-medium text-[56px] transition-colors"
                style={{
                  color: "var(--ink-dark-subtle)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                {s.n}
              </div>
              <h3
                className="mt-8 font-display font-semibold text-[22px]"
                style={{ color: "var(--ink-dark)" }}
              >
                {s.title}
              </h3>
              <p
                className="mt-2 text-[15px]"
                style={{
                  color: "var(--ink-dark-muted)",
                  lineHeight: 1.55,
                }}
              >
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>

      <style>{`
        .step-card:hover .step-num { color: var(--accent); transition: color 200ms; }
      `}</style>
    </section>
  );
}
