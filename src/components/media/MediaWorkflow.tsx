/**
 * MediaWorkflow — три шага.
 */
import { motion } from "framer-motion";
import { Container } from "@/components/layout/container";

const ease = [0.2, 0.8, 0.2, 1] as const;

const STEPS = [
  {
    n: "01",
    title: "Расскажи о бренде",
    body: "Что продаёшь, кто аудитория, какой тон. 5 минут и у студии есть всё, чтобы говорить твоим голосом.",
  },
  {
    n: "02",
    title: "Опиши задачу",
    body: "Один промт, десятки вариантов. Хочешь карусель про эмоциональное выгорание? Получишь 5 версий.",
  },
  {
    n: "03",
    title: "Получи готовое",
    body: "Скачивай готовые файлы, копируй тексты, публикуй. Можно подключить автопубликацию в Telegram, VK и Instagram.",
  },
];

export function MediaWorkflow() {
  return (
    <section className="py-20 lg:py-32" style={{ background: "var(--bg-base)" }}>
      <Container size="wide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease }}
          className="max-w-[720px]"
        >
          <div className="inline-flex items-center gap-2 font-mono text-[12px]" style={{ color: "var(--ink-dark-muted)" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            Как работает
          </div>
          <h2 className="mt-4 font-display font-semibold text-[36px] lg:text-[52px]"
            style={{ color: "var(--ink-dark)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Три шага от идеи до публикации.
          </h2>
          <p className="mt-5 text-[16px] lg:text-[18px]"
            style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}>
            Без дизайнера, копирайтера и согласований.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease, delay: i * 0.08 }}
              className="group relative rounded-2xl border p-7"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border-dark)",
              }}
            >
              <div
                className="font-display text-[56px] font-medium tabular-nums transition-colors"
                style={{
                  color: "var(--ink-dark-subtle)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                <span className="group-hover:text-[var(--accent)]" style={{ transition: "color 200ms" }}>
                  {s.n}
                </span>
              </div>
              <h3 className="mt-8 font-display text-[22px] font-semibold"
                style={{ color: "var(--ink-dark)", letterSpacing: "-0.01em" }}>
                {s.title}
              </h3>
              <p className="mt-2 text-[14px]" style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}>
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
