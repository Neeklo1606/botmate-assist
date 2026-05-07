/**
 * HeroHome — главный hero новой главной (dark v2).
 * Eyebrow + H1 + subtitle + 2 CTA + product preview placeholder с tabs.
 */
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Inbox,
  Bot,
  MessagesSquare,
  BookOpen,
  Settings,
} from "lucide-react";
import { Container } from "@/components/layout/container";

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
                style={{
                  background: "var(--accent)",
                  animationDuration: "3s",
                }}
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
              to="/assistant"
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

          {/* Tabs */}
          <motion.div
            {...fadeUp(0.4)}
            className="mt-20 w-full max-w-[1080px] sm:mt-20"
          >
            <div
              className="flex h-12 items-center justify-center gap-1 border-b"
              style={{ borderColor: "var(--border-dark)" }}
            >
              {[
                { label: "Ассистент", active: true },
                { label: "Медиа", active: false },
                { label: "Сайт", active: false },
              ].map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  className="relative h-12 px-5 text-[14px] sm:text-[15px] font-medium transition-colors"
                  style={{
                    color: tab.active
                      ? "var(--ink-dark)"
                      : "var(--ink-dark-muted)",
                  }}
                >
                  {tab.label}
                  {tab.active && (
                    <span
                      className="absolute inset-x-2 -bottom-px h-[2px]"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Preview card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease, delay: 0.5 }}
            className="mt-4 w-full max-w-[1080px] overflow-hidden rounded-[20px] border"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-dark)",
              height: "min(540px, 60vh)",
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.02), 0 30px 80px rgba(0,0,0,0.6)",
              backgroundImage:
                "linear-gradient(180deg, transparent 0%, rgba(197,240,74,0.02) 100%)",
            }}
          >
            <PreviewMock />
          </motion.div>

          <motion.div
            {...fadeUp(0.7)}
            className="mt-4 text-xs font-mono"
            style={{ color: "var(--ink-dark-subtle)" }}
          >
            Превью кабинета · скоро интерактивно
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

function PreviewMock() {
  const navItems = [
    { icon: Inbox, label: "Входящие", active: false },
    { icon: Bot, label: "Ассистенты", active: true },
    { icon: MessagesSquare, label: "Диалоги", active: false },
    { icon: BookOpen, label: "База знаний", active: false },
    { icon: Settings, label: "Настройки", active: false },
  ];
  const convs = [
    { name: "Анна К.", initials: "АК", msg: "Спасибо, очень помогло!", time: "2 мин", active: true },
    { name: "Михаил С.", initials: "МС", msg: "Когда можно записаться?", time: "12 мин", active: false },
    { name: "Елена П.", initials: "ЕП", msg: "А какая стоимость?", time: "1 ч", active: false },
    { name: "Дмитрий В.", initials: "ДВ", msg: "Передам менеджеру", time: "3 ч", active: false },
    { name: "Ольга Р.", initials: "ОР", msg: "Приду завтра в 14:00", time: "вчера", active: false },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Browser bar */}
      <div
        className="flex h-10 shrink-0 items-center gap-3 border-b px-4"
        style={{ borderColor: "var(--border-dark)" }}
      >
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#3a3a3f" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#3a3a3f" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#3a3a3f" }} />
        </div>
        <div
          className="ml-2 hidden rounded-md px-3 py-1 text-[11px] font-mono sm:block"
          style={{
            background: "var(--bg-soft)",
            color: "var(--ink-dark-subtle)",
          }}
        >
          botme.app/assistant/inbox
        </div>
      </div>

      {/* Split */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <div
          className="hidden w-[180px] shrink-0 border-r p-3 sm:block"
          style={{ borderColor: "var(--border-dark)" }}
        >
          <div className="space-y-1">
            {navItems.map((it) => (
              <div
                key={it.label}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px]"
                style={{
                  background: it.active ? "var(--bg-soft)" : "transparent",
                  color: it.active ? "var(--ink-dark)" : "var(--ink-dark-muted)",
                }}
              >
                <it.icon className="h-4 w-4" strokeWidth={1.75} />
                {it.label}
              </div>
            ))}
          </div>
        </div>

        {/* Conversations */}
        <div className="min-w-0 flex-1 overflow-hidden">
          {convs.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-3 border-b px-4 py-3.5"
              style={{
                borderColor: "var(--border-dark)",
                background: c.active ? "var(--bg-soft)" : "transparent",
                borderLeft: c.active
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-medium"
                style={{
                  background: "var(--bg-soft-hover)",
                  color: "var(--ink-dark)",
                }}
              >
                {c.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="flex items-center justify-between gap-2 text-[13px]"
                  style={{ color: "var(--ink-dark)" }}
                >
                  <span className="truncate font-medium">{c.name}</span>
                  <span
                    className="shrink-0 text-[11px] font-mono"
                    style={{ color: "var(--ink-dark-subtle)" }}
                  >
                    {c.time}
                  </span>
                </div>
                <div
                  className="mt-0.5 truncate text-[12px]"
                  style={{ color: "var(--ink-dark-muted)" }}
                >
                  {c.msg}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
