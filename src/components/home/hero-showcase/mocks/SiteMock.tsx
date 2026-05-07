/**
 * SiteMock — preview конструктора сайтов (split-screen builder).
 */
import { useEffect, useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Monitor,
  Tablet,
  Smartphone,
  BookOpen,
  Users,
  Award,
} from "lucide-react";

const SECTIONS = [
  { l: "Hero", state: "ready" as const, active: true },
  { l: "Что вы получите", state: "ready" as const, active: false },
  { l: "Кейсы", state: "progress" as const, active: false },
  { l: "Тарифы", state: "ready" as const, active: false },
  { l: "FAQ", state: "progress" as const, active: false },
  { l: "Footer", state: "draft" as const, active: false },
];

const STATE_COLOR = {
  ready: "var(--accent)",
  progress: "#F6B547",
  draft: "var(--ink-dark-subtle)",
};

const FEATURES = [
  { I: BookOpen, t: "Теория", s: "Биохимия, витамины, БАДы" },
  { I: Users, t: "Практика", s: "Кейсы реальных клиентов" },
  { I: Award, t: "Диплом", s: "Запись в реестр специалистов" },
];

export function SiteMock() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setProgress(67), 100);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex h-full">
      {/* Outline panel */}
      <div
        className="hidden w-[280px] shrink-0 flex-col border-r md:flex"
        style={{ borderColor: "var(--border-dark)", background: "var(--bg-base)" }}
      >
        <div
          className="flex h-12 items-center justify-between border-b px-4"
          style={{ borderColor: "var(--border-dark)" }}
        >
          <span className="text-[14px] font-medium" style={{ color: "var(--ink-dark)" }}>
            Структура
          </span>
          <Plus className="h-3.5 w-3.5" style={{ color: "var(--ink-dark-muted)" }} />
        </div>

        <div className="flex-1 py-3">
          {SECTIONS.map((s) => (
            <div
              key={s.l}
              className="flex h-9 items-center gap-2.5 px-4 text-[13px]"
              style={{
                background: s.active ? "var(--bg-soft)" : "transparent",
                color: s.active ? "var(--ink-dark)" : "var(--ink-dark-muted)",
                fontWeight: s.active ? 500 : 400,
                borderLeft: s.active ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: STATE_COLOR[s.state] }}
              />
              {s.l}
            </div>
          ))}
          <div
            className="mt-2 flex items-center gap-2 px-4 py-2 text-[13px]"
            style={{ color: "var(--ink-dark-muted)" }}
          >
            <Plus className="h-3.5 w-3.5" />
            Добавить секцию
          </div>
        </div>

        <div
          className="flex flex-col gap-2 border-t p-4"
          style={{ borderColor: "var(--border-dark)" }}
        >
          <div className="flex justify-between">
            <span className="text-[12px]" style={{ color: "var(--ink-dark-muted)" }}>
              Готовность
            </span>
            <span className="font-mono text-[12px]" style={{ color: "var(--accent)" }}>
              67%
            </span>
          </div>
          <div
            className="h-1 overflow-hidden rounded-full"
            style={{ background: "var(--bg-soft)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                background: "var(--accent)",
                width: `${progress}%`,
                transition: "width 1.2s cubic-bezier(0.2,0.8,0.2,1)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Preview frame */}
      <div className="flex min-w-0 flex-1 flex-col" style={{ background: "var(--bg-base)" }}>
        <div
          className="flex h-8 items-center gap-2 border-b px-3"
          style={{ borderColor: "var(--border-dark)", background: "var(--bg-soft)" }}
        >
          <ChevronLeft className="h-3 w-3" style={{ color: "var(--ink-dark-subtle)" }} />
          <ChevronRight className="h-3 w-3" style={{ color: "var(--ink-dark-subtle)" }} />
          <RotateCcw className="h-3 w-3" style={{ color: "var(--ink-dark-subtle)" }} />
          <span
            className="ml-2 rounded font-mono text-[10px]"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-dark)",
              color: "var(--ink-dark-muted)",
              padding: "2px 8px",
            }}
          >
            anna-nutritio.botme.app
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <Monitor className="h-3 w-3" style={{ color: "var(--ink-dark)" }} />
            <Tablet className="h-3 w-3" style={{ color: "var(--ink-dark-subtle)" }} />
            <Smartphone className="h-3 w-3" style={{ color: "var(--ink-dark-subtle)" }} />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Mini hero */}
          <div
            className="flex flex-col items-center px-6 py-10 text-center sm:px-8"
            style={{
              background: "linear-gradient(180deg, var(--bg-base) 0%, var(--bg-elevated) 100%)",
            }}
          >
            <span
              className="rounded-full font-mono text-[10px]"
              style={{
                background: "var(--bg-soft)",
                border: "1px solid var(--border-dark)",
                color: "var(--ink-dark-muted)",
                padding: "4px 10px",
              }}
            >
              Курс по нутрициологии
            </span>
            <h1
              className="mt-4 text-[24px] font-semibold sm:text-[28px]"
              style={{
                color: "var(--ink-dark)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Стать нутрициологом
              <br />
              за 4 месяца
            </h1>
            <p
              className="mt-3 max-w-[360px] text-[13px] sm:text-[14px]"
              style={{ color: "var(--ink-dark-muted)" }}
            >
              Онлайн-курс для тех, кто хочет помогать людям и зарабатывать
            </p>
            <div className="mt-5 flex items-center gap-2">
              <span
                className="flex h-9 items-center rounded-lg px-4 text-[12px] font-medium"
                style={{ background: "var(--accent)", color: "var(--bg-base)" }}
              >
                Начать обучение
              </span>
              <span
                className="flex h-9 items-center rounded-lg px-3.5 text-[12px]"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-dark)",
                  color: "var(--ink-dark-muted)",
                }}
              >
                Программа курса
              </span>
            </div>
          </div>

          {/* Section: Программа */}
          <div
            className="border-t px-6 pb-5 pt-6 sm:px-8"
            style={{
              borderColor: "var(--border-dark)",
              background: "var(--bg-elevated)",
            }}
          >
            <span
              className="font-mono text-[10px] uppercase"
              style={{ color: "var(--ink-dark-subtle)", letterSpacing: "0.06em" }}
            >
              Программа
            </span>
            <h2
              className="mt-1.5 text-[18px] font-medium"
              style={{ color: "var(--ink-dark)" }}
            >
              4 модуля. 16 уроков. 1 диплом.
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {FEATURES.map((f) => (
                <div
                  key={f.t}
                  className="rounded-[10px] p-3.5"
                  style={{
                    background: "var(--bg-base)",
                    border: "1px solid var(--border-dark)",
                  }}
                >
                  <f.I className="h-[18px] w-[18px]" strokeWidth={1.75} style={{ color: "var(--accent)" }} />
                  <div
                    className="mt-2 text-[12px] font-medium"
                    style={{ color: "var(--ink-dark)" }}
                  >
                    {f.t}
                  </div>
                  <div
                    className="mt-0.5 text-[10px]"
                    style={{ color: "var(--ink-dark-muted)" }}
                  >
                    {f.s}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
