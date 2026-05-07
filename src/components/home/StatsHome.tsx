/**
 * StatsHome — 4 крупных числа с count-up при появлении в viewport.
 */
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Container } from "@/components/layout/container";

interface Stat {
  /** Финальное число для count-up. null — не считаем (например "3 дня" уже строка). */
  value: number | null;
  /** Что отображать как итог (если value=null, берём это как есть). */
  display: string;
  suffix?: string;
  label: string;
  prefix?: string;
}

const stats: Stat[] = [
  { value: 47, display: "47", label: "КОМПАНИИ С BOTME" },
  { value: 3, display: "3", suffix: "дня", label: "СРЕДНИЙ ЗАПУСК ПРОЕКТА" },
  { value: 4, display: "4", suffix: "ч/день", label: "ЭКОНОМИЯ НА МЕНЕДЖЕРЕ" },
  { value: 38, display: "38", prefix: "+", suffix: "%", label: "КОНВЕРСИЯ В ЛИДА" },
];

export function StatsHome() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="border-t border-b py-16 lg:py-24"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border-dark)",
      }}
    >
      <Container size="wide">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-6">
          {stats.map((s) => (
            <StatBlock key={s.label} stat={s} run={inView} />
          ))}
        </div>
        <div
          className="mt-8 text-center text-[12px] font-mono"
          style={{ color: "var(--ink-dark-subtle)" }}
        >
          Средние данные по клиентам botme · обновлено в марте 2026
        </div>
      </Container>
    </section>
  );
}

function StatBlock({ stat, run }: { stat: Stat; run: boolean }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!run || stat.value === null) return;
    const target = stat.value;
    const start = performance.now();
    const dur = 1200;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      // easeOut quart
      const eased = 1 - Math.pow(1 - p, 4);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, stat.value]);

  const num = stat.value === null ? stat.display : String(n);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={run ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div
        className="font-display font-medium text-[40px] lg:text-[64px] tabular-nums"
        style={{
          color: "var(--ink-dark)",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {stat.prefix}
        {num}
        {stat.suffix && (
          <span
            className="ml-2 text-[18px] font-normal"
            style={{ color: "var(--ink-dark-muted)" }}
          >
            {stat.suffix}
          </span>
        )}
      </div>
      <div
        className="mt-3 text-[11px] font-mono uppercase"
        style={{
          color: "var(--ink-dark-subtle)",
          letterSpacing: "0.05em",
        }}
      >
        {stat.label}
      </div>
    </motion.div>
  );
}
