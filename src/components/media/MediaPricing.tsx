/**
 * MediaPricing — 3 тарифа.
 */
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Container } from "@/components/layout/container";

const ease = [0.2, 0.8, 0.2, 1] as const;

interface Plan {
  name: string;
  tagline: string;
  price: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Старт",
    tagline: "Для одного эксперта или маленького блога",
    price: "4 900",
    features: ["До 8 постов в месяц", "1 профиль / бренд", "Все форматы", "Базовая аналитика"],
    cta: "Попробовать",
  },
  {
    name: "Рост",
    tagline: "Для бизнеса с регулярными публикациями",
    price: "12 900",
    features: [
      "До 60 постов в месяц",
      "До 3 профилей",
      "Все форматы и автопубликация",
      "Расширенная аналитика",
      "Приоритетная поддержка",
    ],
    cta: "Выбрать Рост",
    highlighted: true,
  },
  {
    name: "Студия",
    tagline: "Для агентств с несколькими клиентами",
    price: "29 900",
    features: [
      "До 200 постов в месяц",
      "Безлимит профилей",
      "Командный доступ (до 5)",
      "White-label отчёты",
      "Менеджер onboarding",
    ],
    cta: "Связаться",
  },
];

export function MediaPricing() {
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
          <div className="inline-flex items-center gap-2 font-mono text-[12px]" style={{ color: "var(--ink-dark-muted)" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            Тарифы Медиа
          </div>
          <h2 className="mt-4 font-display font-semibold text-[36px] lg:text-[52px]"
            style={{ color: "var(--ink-dark)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Платишь за контент, не за «лицензии».
          </h2>
          <p className="mt-5 text-[16px] lg:text-[18px]" style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}>
            Выбери ритм публикаций. Можно перейти на больший тариф в любой момент.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease, delay: i * 0.08 }}
              className="pricing-card relative flex flex-col rounded-[20px] border p-8"
              style={{
                background: "var(--bg-elevated)",
                borderColor: p.highlighted ? "var(--accent)" : "var(--border-dark)",
              }}
            >
              {p.highlighted && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full font-mono text-[10px] uppercase"
                  style={{
                    background: "var(--accent)",
                    color: "var(--bg-base)",
                    padding: "4px 12px",
                    letterSpacing: "0.05em",
                  }}
                >
                  ХИТ
                </span>
              )}
              <div className="font-display text-[22px] font-semibold" style={{ color: "var(--ink-dark)" }}>
                {p.name}
              </div>
              <div className="mt-1.5 text-[13px]" style={{ color: "var(--ink-dark-muted)" }}>
                {p.tagline}
              </div>

              <div className="mt-6 flex items-baseline gap-2">
                <div
                  className="font-display text-[44px] font-medium tabular-nums"
                  style={{ color: "var(--ink-dark)", letterSpacing: "-0.03em", lineHeight: 1 }}
                >
                  {p.price}
                </div>
                <div className="font-mono text-[14px]" style={{ color: "var(--ink-dark-muted)" }}>
                  ₽ / мес
                </div>
              </div>

              <ul className="mt-7 flex flex-col gap-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[14px]" style={{ color: "var(--ink-dark)" }}>
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.5} style={{ color: "var(--accent)" }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <Link
                  to="/onboarding/media"
                  className="inline-flex h-11 w-full items-center justify-center rounded-[10px] text-[14px] font-medium transition-transform"
                  style={{
                    background: p.highlighted ? "var(--accent)" : "transparent",
                    color: p.highlighted ? "var(--bg-base)" : "var(--ink-dark)",
                    border: p.highlighted ? "none" : "1px solid var(--border-dark-strong)",
                    transitionTimingFunction: "cubic-bezier(0.2,0.8,0.2,1)",
                    transitionDuration: "180ms",
                  }}
                >
                  {p.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-6 text-center font-mono text-[12px]" style={{ color: "var(--ink-dark-subtle)" }}>
          Можно подключить только Медиа или весь botme · Ассистент + Медиа + Сайт
        </p>
      </Container>

      <style>{`
        .pricing-card { transition: transform 200ms cubic-bezier(0.2,0.8,0.2,1); }
        .pricing-card:hover { transform: translateY(-2px); }
      `}</style>
    </section>
  );
}
