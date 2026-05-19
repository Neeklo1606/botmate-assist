/**
 * HeroHome — главный hero новой главной (dark v2).
 * Eyebrow + H1 + subtitle + 2 CTA + интерактивная HeroShowcase карусель.
 */
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { HeroShowcase } from "./hero-showcase/HeroShowcase";

const ease = [0.2, 0.8, 0.2, 1] as const;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease, delay },
});

export function HeroHome() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Layer 2 — radial gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[800px]"
        style={{
          background:
            "radial-gradient(ellipse 1400px 800px at 50% 0%, rgba(197,240,74,0.08) 0%, rgba(60,80,120,0.04) 25%, transparent 60%)",
        }}
      />
      {/* Layer 3 — subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(244,244,241,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(244,244,241,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 800px 600px at 50% 30%, black 0%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 800px 600px at 50% 30%, black 0%, transparent 70%)",
        }}
      />

      <Container size="wide" className="relative pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center text-center">
          {/* Eyebrow */}
          <motion.div {...fadeUp(0)}>
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-mono"
              style={{
                background: "var(--bg-soft)",
                borderColor: "var(--border-dark)",
                color: "var(--ink-dark-muted)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ background: "var(--accent)", animationDuration: "3s" }}
              />
              <span className="hidden sm:inline">
                Зонтик из трёх AI-инструментов · 2026
              </span>
              <span className="sm:hidden">Три AI-инструмента</span>
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            {...fadeUp(0.1)}
            className="mt-6 font-display font-semibold"
            style={{
              color: "var(--ink-dark)",
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
            }}
          >
            <span className="block text-[44px] sm:text-[60px] lg:text-[88px]">
              Один{" "}
              <span
                className="hero-gradient-text"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #F4F4F1 0%, #C5F04A 50%, #F4F4F1 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundSize: "200% 100%",
                  animation: "gradient-shift 8s ease-in-out infinite",
                }}
              >
                помощник.
              </span>
            </span>
            <span className="block text-[44px] sm:text-[60px] lg:text-[88px]">
              Весь твой бизнес.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            {...fadeUp(0.2)}
            className="mt-6 max-w-[720px] text-base lg:text-[20px]"
            style={{
              color: "var(--ink-dark-muted)",
              lineHeight: 1.5,
              letterSpacing: "-0.01em",
            }}
          >
            Ассистент, который отвечает клиентам. Медиа-студия, которая делает
            контент. Конструктор, который собирает сайты. Всё внутри одного
            аккаунта.
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...fadeUp(0.3)}
            className="mt-10 flex w-full flex-col items-stretch gap-2.5 sm:w-auto sm:flex-row sm:gap-3"
          >
            <Link
              to="/onboarding/assistant"
              className="cta-primary inline-flex h-[52px] items-center justify-center rounded-[12px] px-7 text-[15px] font-medium transition-transform"
              style={{
                background: "var(--accent)",
                color: "var(--bg-base)",
                transitionTimingFunction: "cubic-bezier(0.2,0.8,0.2,1)",
                transitionDuration: "180ms",
              }}
            >
              Начать бесплатно
              <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={2} />
            </Link>
            <a
              href="#products"
              className="cta-secondary inline-flex h-[52px] items-center justify-center rounded-[12px] border px-6 text-[15px] font-medium"
              style={{
                background: "transparent",
                borderColor: "var(--border-dark-strong)",
                color: "var(--ink-dark)",
                transitionTimingFunction: "cubic-bezier(0.2,0.8,0.2,1)",
                transitionDuration: "180ms",
              }}
            >
              Посмотреть продукты
            </a>
          </motion.div>

          {/* Interactive product showcase carousel */}
          <motion.div
            {...fadeUp(0.4)}
            className="w-full"
          >
            <HeroShowcase />
          </motion.div>
        </div>
      </Container>

      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .cta-primary:hover {
          transform: scale(1.02);
          box-shadow: 0 0 40px rgba(197,240,74,0.3);
        }
        .cta-secondary:hover {
          background: var(--bg-soft);
          border-color: rgba(197,240,74,0.3);
        }
      `}</style>
    </section>
  );
}
