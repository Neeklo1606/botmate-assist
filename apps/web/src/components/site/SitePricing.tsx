/**
 * SitePricing — 3 тарифа Сайт.
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
    name: "Лайт",
    tagline: "Один лендинг для одного предложения",
    price: "4 900",
    features: [
      "1 лендинг",
      "Поддомен .botme.app",
      "Базовая Метрика",
      "Форма заявок",
      "До 5 правок в месяц",
    ],
    cta: "Попробовать",
  },
  {
    name: "Бизнес",
    tagline: "Несколько направлений в одном бизнесе",
    price: "9 900",
    features: [
      "До 5 лендингов",
      "Свой домен",
      "SSL и SEO",
      "Интеграция с CRM",
      "Безлимит правок",
      "Приоритетная поддержка",
    ],
    cta: "Выбрать Бизнес",
    highlighted: true,
  },
  {
    name: "Студия",
    tagline: "Для агентств с клиентами",
    price: "24 900",
    features: [
      "До 30 лендингов",
      "Свои домены клиентов",
      "White-label",
      "Командный доступ (до 10)",
      "API",
      "Менеджер onboarding",
    ],
    cta: "Связаться",
  },
];

export function SitePricing() {
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
            Тарифы Сайт
          </div>
          <h2
            className="mt-4 font-display font-semibold text-[36px] lg:text-[52px]"
            style={{
              color: "var(--ink-dark)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Платишь только за работающий сайт.
          </h2>
          <p
            className="mt-5 text-[16px] lg:text-[18px]"
            style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}
          >
            Без оплат за «места», «слоты», «дизайнеров».
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
                background: "var(--bg-base)",
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
                  Хит
                </span>
              )}
              <div
                className="font-display text-[22px] font-semibold"
                style={{ color: "var(--ink-dark)" }}
              >
                {p.name}
              </div>
              <div
                className="mt-1.5 text-[13px]"
                style={{ color: "var(--ink-dark-muted)" }}
              >
                {p.tagline}
              </div>

              <div className="mt-6 flex items-baseline gap-2">
                <div
                  className="font-display text-[44px] font-medium tabular-nums"
                  style={{
                    color: "var(--ink-dark)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {p.price}
                </div>
                <div
                  className="font-mono text-[14px]"
                  style={{ color: "var(--ink-dark-muted)" }}
                >
                  ₽ / мес
                </div>
              </div>

              <ul className="mt-7 flex flex-col gap-2.5">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[14px]"
                    style={{ color: "var(--ink-dark)" }}
                  >
                    <Check
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      strokeWidth={2.5}
                      style={{ color: "var(--accent)" }}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <Link
                  to="/onboarding/site"
                  className="inline-flex h-11 w-full items-center justify-center rounded-[10px] text-[14px] font-medium transition-transform"
                  style={{
                    background: p.highlighted ? "var(--accent)" : "transparent",
                    color: p.highlighted ? "var(--bg-base)" : "var(--ink-dark)",
                    border: p.highlighted
                      ? "none"
                      : "1px solid var(--border-dark-strong)",
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
      </Container>
      <style>{`
        .pricing-card { transition: transform 200ms cubic-bezier(0.2,0.8,0.2,1); }
        .pricing-card:hover { transform: translateY(-2px); }
      `}</style>
    </section>
  );
}
