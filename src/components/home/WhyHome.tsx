/**
 * WhyHome — 4 причины выбрать botme. Grid 2x2 desktop / 1col mobile.
 */
import { motion } from "framer-motion";
import { Layers, Lock, Users, Zap, type LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/container";

const ease = [0.2, 0.8, 0.2, 1] as const;

interface Reason {
  icon: LucideIcon;
  title: string;
  body: string;
}

const reasons: Reason[] = [
  {
    icon: Zap,
    title: "Скорость, а не функционал",
    body: "Не настраиваешь пайплайны. Получаешь рабочий продукт. День 1 — бриф, день 2 — настройка, день 3 — запуск.",
  },
  {
    icon: Layers,
    title: "Три инструмента в одном",
    body: "Ассистент отвечает клиентам. Медиа делает контент. Сайт собирает лендинг. Один аккаунт, одна подписка.",
  },
  {
    icon: Users,
    title: "Команда настраивает за тебя",
    body: "Не «AI-конструктор», а живые люди. neeklo studio собирает ассистента вручную под твой бизнес.",
  },
  {
    icon: Lock,
    title: "Серверы в РФ, 152-ФЗ",
    body: "Все данные хранятся в России. Договор-оферта, политика, СОП на обработку — готовый юридический пакет.",
  },
];

export function WhyHome() {
  return (
    <section
      className="py-20 lg:py-32"
      style={{ background: "var(--bg-base)" }}
    >
      <Container size="wide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease }}
          className="mx-auto max-w-[800px] text-center"
        >
          <span
            className="inline-flex items-center rounded-full border px-3.5 py-1.5 text-[12px] font-mono"
            style={{
              background: "var(--bg-soft)",
              borderColor: "var(--border-dark)",
              color: "var(--ink-dark-muted)",
            }}
          >
            Почему botme
          </span>
          <h2
            className="mt-5 font-display font-semibold text-[32px] lg:text-[48px]"
            style={{
              color: "var(--ink-dark)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Не ещё одна AI-платформа. Помощник под ключ.
          </h2>
          <p
            className="mt-4 text-[16px] lg:text-[18px]"
            style={{ color: "var(--ink-dark-muted)" }}
          >
            Мы не даём конструктор. Мы даём результат за тебя.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-2">
          {reasons.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease, delay: i * 0.06 }}
              className="flex flex-col rounded-[16px] border p-8"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border-dark)",
              }}
            >
              <r.icon
                className="h-7 w-7"
                style={{ color: "var(--accent)" }}
                strokeWidth={1.75}
              />
              <h3
                className="mt-5 font-display font-semibold text-[22px]"
                style={{ color: "var(--ink-dark)" }}
              >
                {r.title}
              </h3>
              <p
                className="mt-2 text-[15px]"
                style={{
                  color: "var(--ink-dark-muted)",
                  lineHeight: 1.55,
                }}
              >
                {r.body}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
