/**
 * GeneratedPagePreview — мок сгенерированного лендинга, блоки появляются stagger.
 */
import { motion } from "framer-motion";

const ease = [0.2, 0.8, 0.2, 1] as const;

const block = (delay: number) => ({
  initial: { opacity: 0, y: 12, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.5, ease, delay: delay / 1000 },
});

export function GeneratedPagePreview({ reduced = false }: { reduced?: boolean }) {
  const d = (ms: number) => (reduced ? 0 : ms);
  return (
    <div className="flex flex-col gap-2 p-3">
      {/* Hero */}
      <motion.div
        {...block(d(800))}
        className="rounded-lg p-4 text-center"
        style={{
          background:
            "linear-gradient(160deg, rgba(197,240,74,0.08) 0%, var(--bg-elevated) 100%)",
          border: "1px solid var(--border-dark)",
        }}
      >
        <div
          className="inline-block rounded-full px-2 py-0.5 font-mono text-[8px] uppercase"
          style={{
            background: "var(--bg-soft)",
            color: "var(--ink-dark-muted)",
            letterSpacing: "0.05em",
          }}
        >
          Курс по фитнесу
        </div>
        <div
          className="mt-2 font-display text-[14px] font-semibold leading-tight"
          style={{ color: "var(--ink-dark)", letterSpacing: "-0.02em" }}
        >
          Сильное тело
          <br />
          за 8 недель
        </div>
        <div className="mt-1 text-[10px]" style={{ color: "var(--ink-dark-muted)" }}>
          Для женщин 25-40
        </div>
        <div className="mt-2 flex justify-center gap-1.5">
          <span
            className="rounded px-2 py-1 text-[9px] font-medium"
            style={{ background: "var(--accent)", color: "var(--bg-base)" }}
          >
            Записаться
          </span>
          <span
            className="rounded border px-2 py-1 text-[9px]"
            style={{ borderColor: "var(--border-dark-strong)", color: "var(--ink-dark)" }}
          >
            Программа
          </span>
        </div>
      </motion.div>

      {/* Features */}
      <motion.div
        {...block(d(2200))}
        className="rounded-lg p-3"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-dark)" }}
      >
        <div
          className="font-mono text-[8px] uppercase"
          style={{ color: "var(--ink-dark-subtle)", letterSpacing: "0.05em" }}
        >
          Программа
        </div>
        <div
          className="mt-1 font-display text-[11px] font-semibold"
          style={{ color: "var(--ink-dark)" }}
        >
          3 модуля. 24 тренировки.
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded p-1.5"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border-dark)" }}
            >
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
              />
              <div
                className="mt-1 text-[9px] font-medium"
                style={{ color: "var(--ink-dark)" }}
              >
                Модуль {i}
              </div>
              <div className="text-[8px]" style={{ color: "var(--ink-dark-muted)" }}>
                8 занятий
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Pricing */}
      <motion.div
        {...block(d(3000))}
        className="rounded-lg p-3"
        style={{ background: "var(--bg-base)", border: "1px solid var(--border-dark)" }}
      >
        <div
          className="text-center font-display text-[11px] font-semibold"
          style={{ color: "var(--ink-dark)" }}
        >
          Тарифы
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <div
            className="rounded p-2 text-center"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-dark)" }}
          >
            <div className="text-[8px]" style={{ color: "var(--ink-dark-muted)" }}>
              База
            </div>
            <div
              className="mt-0.5 font-display text-[12px] font-semibold tabular-nums"
              style={{ color: "var(--ink-dark)" }}
            >
              7 900 ₽
            </div>
          </div>
          <div
            className="rounded p-2 text-center"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--accent)",
            }}
          >
            <div className="text-[8px]" style={{ color: "var(--accent)" }}>
              PRO
            </div>
            <div
              className="mt-0.5 font-display text-[12px] font-semibold tabular-nums"
              style={{ color: "var(--ink-dark)" }}
            >
              12 900 ₽
            </div>
          </div>
        </div>
      </motion.div>

      {/* Final CTA */}
      <motion.div
        {...block(d(3800))}
        className="rounded-lg p-3 text-center"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-dark)" }}
      >
        <span
          className="inline-block rounded px-3 py-1.5 text-[10px] font-medium"
          style={{ background: "var(--accent)", color: "var(--bg-base)" }}
        >
          Начать обучение
        </span>
      </motion.div>
    </div>
  );
}
