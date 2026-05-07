/**
 * SiteHero — интерактивный hero лендинга /site.
 * Слева: текст + CTA. Справа: live-демо "бриф → готовый сайт".
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useInView } from "framer-motion";
import { Check, Globe, Lock, BarChart3, Server } from "lucide-react";
import { Container } from "@/components/layout/container";
import { BriefAnswerLine } from "./parts/BriefAnswerLine";
import { GeneratedPagePreview } from "./parts/GeneratedPagePreview";
import { ProgressGenerator } from "./parts/ProgressGenerator";

const ease = [0.2, 0.8, 0.2, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease, delay },
});

const BRIEF = [
  { q: "Чем занимаешься?", a: "Фитнес-тренер, индивидуальные программы" },
  { q: "Главная услуга?", a: "Курс «Сильное тело за 8 недель»" },
  { q: "Цена?", a: "12 900 ₽ за курс" },
  { q: "Кому продаёшь?", a: "Женщины 25-40, после родов" },
  { q: "Главный результат для клиента?", a: "Минус 5-7 кг и крепкое тело" },
  { q: "Соцсети?", a: "@anna.fitness в Telegram" },
  { q: "Куда вести заявки?", a: "На @anna.fitness в Telegram" },
];

const BULLETS = [
  "Готов к публикации сразу",
  "Свой домен и SSL из коробки",
  "Форма, которая шлёт в Telegram и CRM",
  "Аналитика Яндекс.Метрики уже встроена",
];

const TRUST = [
  { Icon: Globe, label: "Свой домен" },
  { Icon: Lock, label: "SSL автоматом" },
  { Icon: BarChart3, label: "Метрика в коробке" },
  { Icon: Server, label: "Хостинг в РФ" },
];

export function SiteHero() {
  const demoRef = useRef<HTMLDivElement>(null);
  const inView = useInView(demoRef, { once: true, margin: "-10%" });
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

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
            "radial-gradient(ellipse 1200px 700px at 50% 0%, rgba(197,240,74,0.05) 0%, transparent 65%)",
        }}
      />
      <Container size="wide" className="relative">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-14">
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
                Продукт 3 из 3 · Конструктор сайтов
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
              Лендинг
              <br />
              за{" "}
              <span
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
                10 минут
              </span>
              .
            </motion.h1>

            <motion.p
              {...fadeUp(0.2)}
              className="mt-6 max-w-[540px] text-[16px] lg:text-[19px]"
              style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}
            >
              Отвечаешь на 7 вопросов про свой бизнес. Botme собирает готовый
              лендинг с твоим доменом, SSL, формой и аналитикой. Без шаблонов
              на коленке.
            </motion.p>

            <motion.ul {...fadeUp(0.3)} className="mt-7 flex flex-col gap-3">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <Check
                    className="mt-1 h-4 w-4 shrink-0"
                    strokeWidth={2.5}
                    style={{ color: "var(--accent)" }}
                  />
                  <span
                    className="text-[15px]"
                    style={{ color: "var(--ink-dark)", lineHeight: 1.5 }}
                  >
                    {b}
                  </span>
                </li>
              ))}
            </motion.ul>

            <motion.div
              {...fadeUp(0.4)}
              className="mt-9 flex w-full flex-col items-stretch gap-2.5 sm:w-auto sm:flex-row sm:gap-3"
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
                Собрать мой лендинг
              </Link>
              <a
                href="#templates"
                className="cta-secondary inline-flex h-[52px] items-center justify-center rounded-[12px] border px-6 text-[15px] font-medium"
                style={{
                  background: "transparent",
                  borderColor: "var(--border-dark-strong)",
                  color: "var(--ink-dark)",
                  transitionTimingFunction: "cubic-bezier(0.2,0.8,0.2,1)",
                  transitionDuration: "180ms",
                }}
              >
                Посмотреть шаблоны
              </a>
            </motion.div>

            <motion.div
              {...fadeUp(0.5)}
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6"
            >
              {TRUST.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon
                    className="h-3.5 w-3.5"
                    strokeWidth={1.75}
                    style={{ color: "var(--ink-dark-subtle)" }}
                  />
                  <span
                    className="font-mono text-[12px]"
                    style={{ color: "var(--ink-dark-subtle)" }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — interactive demo */}
          <div
            ref={demoRef}
            className="flex w-full flex-col gap-3"
            style={{ minHeight: 480 }}
          >
            <ProgressGenerator start={inView} reduced={reduced} />

            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-[2fr_3fr]">
              {/* Brief */}
              <div
                className="overflow-hidden rounded-[14px] p-4"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-dark)",
                  minHeight: 380,
                }}
              >
                <div
                  className="font-mono text-[10px] uppercase"
                  style={{
                    color: "var(--ink-dark-subtle)",
                    letterSpacing: "0.05em",
                  }}
                >
                  Бриф · 7 вопросов
                </div>
                {inView && (
                  <div className="mt-3.5 flex flex-col gap-3.5">
                    {BRIEF.map((b, i) => (
                      <BriefAnswerLine
                        key={i}
                        q={b.q}
                        a={b.a}
                        delay={400 + i * 800}
                        reduced={reduced}
                        isLast={i === BRIEF.length - 1}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Preview */}
              <div
                className="relative overflow-hidden rounded-[14px]"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border-dark)",
                  minHeight: 380,
                }}
              >
                <div
                  className="flex h-6 items-center gap-1.5 px-2.5"
                  style={{
                    background: "var(--bg-soft)",
                    borderBottom: "1px solid var(--border-dark)",
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: "var(--ink-dark-subtle)" }}
                  />
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: "var(--ink-dark-subtle)" }}
                  />
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: "var(--ink-dark-subtle)" }}
                  />
                  <span
                    className="ml-2 rounded px-2 py-0.5 font-mono text-[9px]"
                    style={{
                      background: "var(--bg-base)",
                      color: "var(--ink-dark-muted)",
                    }}
                  >
                    anna-fitness.botme.app
                  </span>
                </div>
                {inView && <GeneratedPagePreview reduced={reduced} />}
              </div>
            </div>
          </div>
        </div>
      </Container>

      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .cta-primary:hover { transform: scale(1.02); box-shadow: 0 0 40px rgba(197,240,74,0.3); }
        .cta-secondary:hover { background: var(--bg-soft); border-color: rgba(197,240,74,0.3); }
      `}</style>
    </section>
  );
}
