/**
 * MediaFinalCta — финальный CTA.
 */
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/container";

const ease = [0.2, 0.8, 0.2, 1] as const;

export function MediaFinalCta() {
  return (
    <section className="py-20 lg:py-32" style={{ background: "var(--bg-base)" }}>
      <Container size="wide">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease }}
          className="relative mx-auto max-w-[980px] overflow-hidden rounded-[28px] border p-8 text-center sm:p-16"
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
                "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(197,240,74,0.10), transparent 60%)",
            }}
          />
          <span
            className="relative inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[12px]"
            style={{
              background: "var(--bg-soft)",
              borderColor: "var(--border-dark)",
              color: "var(--ink-dark-muted)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            Запуск Медиа за 10 минут
          </span>

          <h2
            className="relative mt-4 font-display font-semibold text-[32px] sm:text-[48px]"
            style={{ color: "var(--ink-dark)", letterSpacing: "-0.03em", lineHeight: 1.05 }}
          >
            Начни делать контент,
            <br />
            который продаёт.
          </h2>
          <p
            className="relative mx-auto mt-4 max-w-[560px] text-[16px] sm:text-[18px]"
            style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}
          >
            Первая неделя бесплатно. Не зашло, отписался в один клик.
          </p>

          <div className="relative mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <Link
              to="/onboarding/media"
              className="cta-primary inline-flex h-[52px] items-center justify-center rounded-[12px] px-7 text-[15px] font-medium transition-transform"
              style={{
                background: "var(--accent)",
                color: "var(--bg-base)",
                transitionTimingFunction: "cubic-bezier(0.2,0.8,0.2,1)",
                transitionDuration: "180ms",
              }}
            >
              Создать первый пост
            </Link>
            <Link
              to="/onboarding/media"
              className="cta-secondary inline-flex h-[52px] items-center justify-center rounded-[12px] border px-6 text-[15px] font-medium"
              style={{
                background: "transparent",
                borderColor: "var(--border-dark-strong)",
                color: "var(--ink-dark)",
                transitionTimingFunction: "cubic-bezier(0.2,0.8,0.2,1)",
                transitionDuration: "180ms",
              }}
            >
              Посмотреть Ассистент
            </Link>
          </div>
        </motion.div>
      </Container>
      <style>{`
        .cta-primary:hover { transform: scale(1.02); box-shadow: 0 0 40px rgba(197,240,74,0.3); }
        .cta-secondary:hover { background: var(--bg-soft); border-color: rgba(197,240,74,0.3); }
      `}</style>
    </section>
  );
}
