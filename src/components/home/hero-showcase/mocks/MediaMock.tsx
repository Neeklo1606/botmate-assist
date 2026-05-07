/**
 * MediaMock — preview медиа-студии генерации контента.
 */
import {
  Sparkles,
  ChevronDown,
  Instagram,
  Download,
  RefreshCw,
  Maximize2,
  AtSign,
} from "lucide-react";

const FORMATS = [
  { id: "post", l: "Пост", active: true },
  { id: "carousel", l: "Карусель", active: false },
  { id: "story", l: "Сторис", active: false },
];

const STYLES = [
  { l: "Минимализм", active: true },
  { l: "Бренд", active: false },
  { l: "Яркий", active: false },
  { l: "Тёмный", active: false },
];

export function MediaMock() {
  return (
    <div className="flex h-full">
      {/* Side panel */}
      <div
        className="hidden w-[320px] shrink-0 flex-col gap-[18px] border-r p-5 md:flex"
        style={{ borderColor: "var(--border-dark)", background: "var(--bg-base)" }}
      >
        <div>
          <div
            className="font-mono text-[11px] uppercase"
            style={{ color: "var(--ink-dark-subtle)", letterSpacing: "0.05em" }}
          >
            Генерация
          </div>
          <h4 className="mt-1 text-[18px] font-medium" style={{ color: "var(--ink-dark)" }}>
            Новый пост
          </h4>
        </div>

        {/* Segmented control */}
        <div
          className="grid h-9 grid-cols-3 gap-1 rounded-[10px] p-1"
          style={{ background: "var(--bg-soft)" }}
        >
          {FORMATS.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-center rounded-md text-[12px]"
              style={{
                background: f.active ? "var(--bg-elevated)" : "transparent",
                border: f.active ? "1px solid var(--border-dark)" : "1px solid transparent",
                color: f.active ? "var(--ink-dark)" : "var(--ink-dark-muted)",
                fontWeight: f.active ? 500 : 400,
              }}
            >
              {f.l}
            </div>
          ))}
        </div>

        {/* Промт */}
        <div className="flex flex-col gap-2">
          <label
            className="text-[12px] font-medium"
            style={{ color: "var(--ink-dark-muted)" }}
          >
            Промт
          </label>
          <div
            className="relative rounded-[10px] p-3 text-[13px]"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-dark)",
              color: "var(--ink-dark)",
              minHeight: 80,
              lineHeight: 1.4,
            }}
          >
            Объявление о новом курсе по нутрициологии. Тёплый тон, фокус на здоровое питание.
            <span
              className="ml-0.5 inline-block h-3.5 w-px align-middle"
              style={{ background: "var(--accent)", animation: "blink-cursor 1s step-end infinite" }}
            />
          </div>
        </div>

        {/* Стиль */}
        <div className="flex flex-col gap-2">
          <label
            className="text-[12px] font-medium"
            style={{ color: "var(--ink-dark-muted)" }}
          >
            Визуальный стиль
          </label>
          <div className="flex flex-wrap gap-1.5">
            {STYLES.map((s) => (
              <span
                key={s.l}
                className="rounded-full font-mono text-[11px]"
                style={{
                  background: s.active ? "var(--bg-soft)" : "var(--bg-elevated)",
                  border: s.active
                    ? "1px solid rgba(197,240,74,0.5)"
                    : "1px solid var(--border-dark)",
                  color: s.active ? "var(--ink-dark)" : "var(--ink-dark-muted)",
                  padding: "6px 12px",
                }}
              >
                {s.l}
              </span>
            ))}
          </div>
        </div>

        {/* Платформа */}
        <div className="flex flex-col gap-2">
          <label
            className="text-[12px] font-medium"
            style={{ color: "var(--ink-dark-muted)" }}
          >
            Платформа
          </label>
          <div
            className="flex h-10 items-center justify-between rounded-[10px] px-3.5"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-dark)",
            }}
          >
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4" strokeWidth={1.75} style={{ color: "var(--ink-dark)" }} />
              <span className="text-[13px]" style={{ color: "var(--ink-dark)" }}>
                Instagram
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--ink-dark-subtle)" }} />
          </div>
        </div>

        <button
          type="button"
          tabIndex={-1}
          className="mt-auto flex h-11 items-center justify-center gap-2 rounded-[10px] text-[14px] font-medium"
          style={{ background: "var(--accent)", color: "var(--bg-base)" }}
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
          Сгенерировать
        </button>
      </div>

      {/* Preview canvas */}
      <div className="flex min-w-0 flex-1 flex-col" style={{ background: "var(--bg-elevated)" }}>
        <div
          className="flex h-12 items-center justify-between border-b px-5"
          style={{ borderColor: "var(--border-dark)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium" style={{ color: "var(--ink-dark)" }}>
              Превью
            </span>
            <span
              className="rounded font-mono text-[11px]"
              style={{
                background: "var(--bg-soft)",
                border: "1px solid var(--border-dark)",
                color: "var(--ink-dark-muted)",
                padding: "2px 8px",
              }}
            >
              1080×1080
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[Download, RefreshCw, Maximize2].map((I, i) => (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ color: "var(--ink-dark-muted)" }}
              >
                <I className="h-4 w-4" strokeWidth={1.75} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 sm:p-8">
          <div
            className="flex aspect-square w-full max-w-[320px] flex-col justify-between p-6 sm:p-8"
            style={{
              background:
                "linear-gradient(135deg, rgba(197,240,74,0.18) 0%, var(--bg-soft) 100%)",
              border: "1px solid var(--border-dark)",
              borderRadius: 16,
            }}
          >
            <div
              className="font-mono text-[10px] uppercase"
              style={{ color: "var(--ink-dark-muted)", letterSpacing: "0.06em" }}
            >
              Понедельник · 09:00
            </div>
            <h3
              className="text-[24px] font-semibold sm:text-[26px]"
              style={{ color: "var(--ink-dark)", lineHeight: 1.1, letterSpacing: "-0.02em" }}
            >
              Что съесть утром,
              <br />
              чтобы не уснуть в 11
            </h3>
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-[13px] font-medium"
                  style={{ color: "var(--ink-dark)" }}
                >
                  Анна Травкина
                </span>
                <span
                  className="font-mono text-[11px]"
                  style={{ color: "var(--ink-dark-muted)" }}
                >
                  @anna.nutrition
                </span>
              </div>
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: "var(--accent)" }}
              >
                <AtSign className="h-3 w-3" strokeWidth={2} style={{ color: "var(--bg-base)" }} />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {[true, false, false].map((active, i) => (
              <div
                key={i}
                className="h-14 w-14 rounded-lg"
                style={{
                  background: "var(--bg-soft)",
                  border: active
                    ? "1px solid rgba(197,240,74,0.5)"
                    : "1px solid var(--border-dark)",
                }}
              />
            ))}
          </div>
        </div>

        <style>{`
          @keyframes blink-cursor {
            50% { opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}
