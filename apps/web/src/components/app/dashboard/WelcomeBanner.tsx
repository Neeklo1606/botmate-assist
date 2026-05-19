/**
 * WelcomeBanner — большой блок для новых пользователей кабинета.
 * Показывается, когда у юзера ещё нет проектов: даёт три CTA на брифы.
 */
import { Link } from "@tanstack/react-router";
import { Bot, Sparkles, Globe, ArrowRight } from "lucide-react";

interface Props {
  userName?: string;
}

const PRODUCTS = [
  {
    to: "/onboarding/assistant" as const,
    icon: Bot,
    title: "Ассистент",
    desc: "Отвечает клиентам в чате 24/7",
    minutes: "5 мин",
  },
  {
    to: "/onboarding/media" as const,
    icon: Sparkles,
    title: "Медиа-студия",
    desc: "Контент в соцсети без копирайтера",
    minutes: "5 мин",
  },
  {
    to: "/onboarding/site" as const,
    icon: Globe,
    title: "Сайт",
    desc: "Лендинг с домом и формой",
    minutes: "7 мин",
  },
];

export function WelcomeBanner({ userName }: Props) {
  return (
    <section
      aria-label="Создать первый проект"
      className="overflow-hidden rounded-2xl p-6 md:p-8"
      style={{
        background:
          "radial-gradient(120% 100% at 0% 0%, rgba(168,255,87,0.10) 0%, transparent 55%), #1a1a1a",
        border: "1px solid #2a2a2a",
      }}
    >
      <div className="mb-5 flex items-start gap-3">
        <span
          className="hidden h-10 w-10 flex-none items-center justify-center rounded-full text-base font-bold sm:inline-flex"
          style={{ background: "#a8ff57", color: "#0a0a0a" }}
          aria-hidden
        >
          ✨
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold tracking-tight text-white md:text-2xl">
            {userName ? `Привет, ${userName}!` : "Привет!"} С чего начнём?
          </h1>
          <p
            className="mt-1 text-sm md:text-[15px]"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Выберите продукт — пройдите короткий бриф, и через 30 секунд
            проект появится здесь, в кабинете.
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {PRODUCTS.map((p) => (
          <li key={p.to}>
            <Link
              to={p.to}
              className="group block h-full rounded-xl p-4 transition-colors"
              style={{
                background: "#141414",
                border: "1px solid #2a2a2a",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(168,255,87,0.45)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a";
              }}
            >
              <div className="toolbar-row">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{
                    background: "rgba(168,255,87,0.10)",
                    color: "#a8ff57",
                    border: "1px solid rgba(168,255,87,0.25)",
                  }}
                >
                  <p.icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.6)",
                    border: "1px solid #2a2a2a",
                  }}
                >
                  {p.minutes}
                </span>
              </div>
              <div className="mt-3 font-display text-base font-semibold text-white">
                {p.title}
              </div>
              <div
                className="mt-1 text-xs leading-snug"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {p.desc}
              </div>
              <div
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium transition-transform group-hover:translate-x-0.5"
                style={{ color: "#a8ff57" }}
              >
                Начать <ArrowRight className="h-3 w-3" strokeWidth={2} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
