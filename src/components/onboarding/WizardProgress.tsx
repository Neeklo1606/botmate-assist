import { motion } from "framer-motion";

interface Props {
  currentIndex: number;
  total: number;
  estimatedMinutesLeft?: number;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function WizardProgress({ currentIndex, total, estimatedMinutesLeft }: Props) {
  const pct = ((currentIndex + 1) / Math.max(total, 1)) * 100;
  return (
    <div className="flex h-12 items-center gap-4 border-b border-border-dark bg-bg-base px-4 md:px-6">
      <span className="font-mono text-[12px] text-ink-dark-subtle tabular-nums">
        Шаг {pad(currentIndex + 1)} из {pad(total)}
      </span>
      <div className="flex-1 overflow-hidden rounded-full bg-bg-elevated" style={{ height: 4 }}>
        <motion.div
          className="h-full bg-accent"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>
      {typeof estimatedMinutesLeft === "number" && (
        <span className="hidden font-mono text-[12px] text-ink-dark-subtle tabular-nums md:inline">
          ~{estimatedMinutesLeft} мин
        </span>
      )}
    </div>
  );
}
