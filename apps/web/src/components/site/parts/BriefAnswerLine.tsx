/**
 * BriefAnswerLine — строка брифа с typewriter-эффектом для ответа.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  q: string;
  a: string;
  delay: number;
  reduced?: boolean;
  isLast?: boolean;
}

const CHAR_MS = 30;
const A_DELAY = 200;

export function BriefAnswerLine({ q, a, delay, reduced = false, isLast = false }: Props) {
  const [shown, setShown] = useState(reduced ? a.length : 0);
  const [started, setStarted] = useState(reduced);
  const [done, setDone] = useState(reduced);

  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setStarted(true), delay + A_DELAY);
    return () => clearTimeout(t);
  }, [delay, reduced]);

  useEffect(() => {
    if (!started || reduced) return;
    if (shown >= a.length) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => setShown((s) => s + 1), CHAR_MS);
    return () => clearTimeout(t);
  }, [started, shown, a.length, reduced]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: reduced ? 0 : delay / 1000 }}
      className={isLast ? "" : "border-b pb-3.5"}
      style={{ borderColor: "var(--border-dark)" }}
    >
      <div
        className="font-mono text-[10px] uppercase"
        style={{ color: "var(--ink-dark-subtle)", letterSpacing: "0.05em" }}
      >
        {q}
      </div>
      <div className="mt-1 text-[13px]" style={{ color: "var(--ink-dark)" }}>
        {a.slice(0, shown)}
        {!done && started && (
          <span
            className="ml-0.5 inline-block animate-pulse"
            style={{ width: 1, height: 12, background: "var(--accent)", verticalAlign: "middle" }}
          />
        )}
      </div>
    </motion.div>
  );
}
