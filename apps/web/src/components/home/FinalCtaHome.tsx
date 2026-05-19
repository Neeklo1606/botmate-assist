/**
 * FinalCtaHome — большой замыкающий блок с двумя CTA.
 */
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/container";

const ease = [0.2, 0.8, 0.2, 1] as const;

export function FinalCtaHome() {
  return (
    <section
      className="py-20 lg:py-32"
      style={{ background: "var(--bg-base)" }}
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease }}
          className="relative mx-auto max-w-[980px] overflow-hidden rounded-[28px] border p-8 text-center lg:p-16"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-dark)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(197,240,74,0.12) 0%, transparent 60%)",
            }}
          />

          <div className="relative">
            <span
              className="inline-flex items-center rounded-full border px-3.5 py-1.5 text-[12px] font-mono"
              style={{
                background: "var(--bg-soft)",
                borderColor: "var(--border-dark)",
                color: "var(--ink-dark-muted)",
              }}
            >
              Запуск за 3 дня
            </span>
            <h2
              className="mt-6 font-display font-semibold text-[32px] lg:text-[56px]"
              style={{
                color: "var(--ink-dark)",
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
              }}
            >
              Хочешь так же?
              <br />
              Давай начнём прямо сейчас.
            </h2>
            <p
              className="mx-auto mt-4 max-w-[640px] text-[16px] lg:text-[18px]"
              style={{ color: "var(--ink-dark-muted)" }}
            >
              Регистрация → бриф → результат. Без звонков, без долгих созвонов.
              Бесплатно для первого продукта.
            </p>

            <div className="mt-8 flex w-full flex-col items-stretch gap-2.5 sm:mx-auto sm:w-auto sm:flex-row sm:justify-center sm:gap-3">
              <Link
                to="/onboarding/assistant"
                className="cta-primary-final inline-flex h-[52px] items-center justify-center rounded-[12px] px-7 text-[15px] font-medium transition-transform"
                style={{
                  background: "var(--accent)",
                  color: "var(--bg-base)",
                  transitionTimingFunction: "cubic-bezier(0.2,0.8,0.2,1)",
                  transitionDuration: "180ms",
                }}
              >
                Начать бесплатно
              </Link>
              <Link
                to="/contacts"
                className="cta-secondary-final inline-flex h-[52px] items-center justify-center rounded-[12px] border px-6 text-[15px] font-medium"
                style={{
                  background: "transparent",
                  borderColor: "var(--border-dark-strong)",
                  color: "var(--ink-dark)",
                  transitionTimingFunction: "cubic-bezier(0.2,0.8,0.2,1)",
                  transitionDuration: "180ms",
                }}
              >
                Поговорить с командой
              </Link>
            </div>
          </div>
        </motion.div>
      </Container>

      <style>{`
        .cta-primary-final:hover {
          transform: scale(1.02);
          box-shadow: 0 0 40px rgba(197,240,74,0.3);
        }
        .cta-secondary-final:hover {
          background: var(--bg-soft);
          border-color: rgba(197,240,74,0.3);
        }
      `}</style>
    </section>
  );
}
