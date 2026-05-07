/**
 * ProgressGenerator — статус-плашка с прогрессбаром генерации.
 */
import { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";

interface Props {
  start: boolean;
  reduced?: boolean;
}

export function ProgressGenerator({ start, reduced = false }: Props) {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!start) return;
    if (reduced) {
      setPct(100);
      setDone(true);
      return;
    }
    const t1 = setTimeout(() => setPct(78), 200);
    const t2 = setTimeout(() => {
      setPct(100);
      setDone(true);
    }, 6500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [start, reduced]);

  return (
    <div
      className="relative flex h-9 items-center justify-between rounded-[10px] px-3.5"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-dark)",
      }}
    >
      <div className="flex items-center gap-2.5">
        {done ? (
          <Check className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} strokeWidth={2.5} />
        ) : (
          <Loader2
            className="h-3.5 w-3.5 animate-spin"
            style={{ color: "var(--accent)" }}
            strokeWidth={2}
          />
        )}
        <span
          className="font-mono text-[12px]"
          style={{ color: "var(--ink-dark-muted)" }}
        >
          {done ? "Готово!" : "Генерируем лендинг..."}
        </span>
      </div>
      <span
        className="font-mono text-[12px] tabular-nums"
        style={{ color: "var(--accent)" }}
      >
        {pct}%
      </span>
      <span
        aria-hidden
        className="absolute -bottom-px left-0 h-[2px] rounded-full"
        style={{
          background: "var(--accent)",
          width: `${pct}%`,
          transition: reduced
            ? "none"
            : `width ${pct === 100 ? "1.5s" : "4s"} cubic-bezier(0.2,0.8,0.2,1)`,
        }}
      />
    </div>
  );
}
