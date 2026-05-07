/**
 * MediaHero — hero лендинга /media. Текст слева, коллаж из 3 mock-объектов справа.
 */
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { MockPostCard } from "./parts/MockPostCard";
import { MockStoryCard } from "./parts/MockStoryCard";
import { MockBannerCard } from "./parts/MockBannerCard";

const ease = [0.2, 0.8, 0.2, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease, delay },
});
const fadeScale = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.55, ease, delay },
});

const STATS = [
  { n: "30 постов", l: "В МЕСЯЦ" },
  { n: "10 минут", l: "НА ЗАПУСК" },
  { n: "5 форматов", l: "ИЗ КОРОБКИ" },
];

export function MediaHero() {
  return (
    <section
      className="relative overflow-hidden pb-12 pt-24 lg:pb-20 lg:pt-32"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[700px]"
        style={{
          background:
            "radial-gradient(ellipse 1200px 700px at 50% 0%, rgba(197,240,74,0.05) 0%, rgba(60,80,120,0.03) 30%, transparent 65%)",
        }}
      />
      <Container size="wide" className="relative">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[3fr_2fr] lg:gap-16">
          {/* LEFT */}
          <div>
            <motion.div {...fadeUp(0)}>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[12px]"
                style={{
                  background: "var(--bg-soft)",
                  borderColor: "var(--border-dark)",
                  color: "var(--ink-dark-muted)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
                Продукт 2 из 3 · Медиа-студия
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp(0.1)}
              className="mt-6 font-display font-semibold text-[40px] sm:text-[56px] lg:text-[72px]"
              style={{
                color: "var(--ink-dark)",
                letterSpacing: "-0.04em",
                lineHeight: 1.0,
              }}
            >
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
                Контент
              </span>{" "}
              для соцсетей.
              <br />
              Без дизайнера.
            </motion.h1>

            <motion.p
              {...fadeUp(0.2)}
              className="mt-6 max-w-[540px] text-[16px] lg:text-[19px]"
              style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}
            >
              GPT пишет тексты под твой бренд. Создаёт обложки сторис, карусели,
              баннеры и посты. Ты получаешь готовый контент-план на месяц вперёд.
            </motion.p>

            <motion.div
              {...fadeUp(0.3)}
              className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-8"
            >
              {STATS.map((s) => (
                <div key={s.n} className="flex flex-col">
                  <div
                    className="font-display text-[28px] font-medium tabular-nums sm:text-[32px]"
                    style={{
                      color: "var(--ink-dark)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    className="mt-1.5 font-mono text-[11px] uppercase"
                    style={{ color: "var(--ink-dark-subtle)", letterSpacing: "0.05em" }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              {...fadeUp(0.4)}
              className="mt-10 flex w-full flex-col items-stretch gap-2.5 sm:w-auto sm:flex-row sm:gap-3"
            >
              <Link
                to="/assistant"
                className="cta-primary inline-flex h-[52px] items-center justify-center rounded-[12px] px-7 text-[15px] font-medium transition-transform"
                style={{
                  background: "var(--accent)",
                  color: "var(--bg-base)",
                  transitionTimingFunction: "cubic-bezier(0.2,0.8,0.2,1)",
                  transitionDuration: "180ms",
                }}
              >
                Начать создавать
                <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={2} />
              </Link>
              <a
                href="#showcase"
                className="cta-secondary inline-flex h-[52px] items-center justify-center rounded-[12px] border px-6 text-[15px] font-medium"
                style={{
                  background: "transparent",
                  borderColor: "var(--border-dark-strong)",
                  color: "var(--ink-dark)",
                  transitionTimingFunction: "cubic-bezier(0.2,0.8,0.2,1)",
                  transitionDuration: "180ms",
                }}
              >
                Посмотреть примеры
              </a>
            </motion.div>
          </div>

          {/* RIGHT — collage */}
          <div
            className="relative mx-auto w-full max-w-[480px]"
            style={{ height: "var(--collage-h, 540px)" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(197,240,74,0.06), transparent 60%)",
              }}
            />

            {/* Story (left, behind) */}
            <motion.div
              {...fadeScale(0.4)}
              className="absolute z-[1] floaty floaty-1"
              style={{
                left: 0,
                top: "10%",
                width: "var(--story-w, 140px)",
                transform: "rotate(var(--story-rot, -8deg))",
                filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))",
              }}
            >
              <MockStoryCard title={"5 минут\nдля себя"} style="minimal" cta="СВАЙП" />
            </motion.div>

            {/* Banner (right, behind) */}
            <motion.div
              {...fadeScale(0.6)}
              className="absolute z-[1] floaty floaty-2"
              style={{
                right: 0,
                bottom: "8%",
                width: "var(--banner-w, 240px)",
                transform: "rotate(var(--banner-rot, 5deg))",
                filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))",
              }}
            >
              <MockBannerCard title="Новый курс" subtitle="Старт 12 марта" style="dark" />
            </motion.div>

            {/* Post (center, top) */}
            <motion.div
              {...fadeScale(0.8)}
              className="absolute z-[2] floaty floaty-3"
              style={{
                top: 0,
                left: "50%",
                width: "var(--post-w, 280px)",
                transform: "translateX(-50%) rotate(var(--post-rot, -2deg))",
                filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.5))",
              }}
            >
              <MockPostCard
                title={"5 продуктов,\nкоторые крадут\nутреннюю энергию"}
                author="Анна Травкина"
                handle="@anna.nutrition"
                style="warm"
                timestamp="ВТ · 09:00"
              />
            </motion.div>
          </div>
        </div>
      </Container>

      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes floaty {
          0%, 100% { translate: 0 0; }
          50% { translate: 0 -10px; }
        }
        .floaty { animation: floaty 4s ease-in-out infinite; }
        .floaty-1 { animation-delay: 1s; }
        .floaty-2 { animation-delay: 2s; }
        .floaty-3 { animation-delay: 0s; }
        .cta-primary:hover { transform: scale(1.02); box-shadow: 0 0 40px rgba(197,240,74,0.3); }
        .cta-secondary:hover { background: var(--bg-soft); border-color: rgba(197,240,74,0.3); }

        @media (max-width: 640px) {
          section :where(.relative) > div[style*="--collage-h"],
          section [style*="--collage-h"] {
            --collage-h: 320px;
            --post-w: 200px;
            --story-w: 100px;
            --banner-w: 160px;
            --post-rot: -1deg;
            --story-rot: -4deg;
            --banner-rot: 2deg;
          }
        }
      `}</style>
    </section>
  );
}
