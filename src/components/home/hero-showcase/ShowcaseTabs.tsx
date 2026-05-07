/**
 * ShowcaseTabs — табы переключения mock-продуктов в hero.
 * Animated underline indicator + autoplay progress bar.
 */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MessagesSquare, Sparkles, LayoutTemplate, type LucideIcon } from "lucide-react";

export type ShowcaseTab = "assistant" | "media" | "site";

interface TabDef {
  id: ShowcaseTab;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
}

const TABS: TabDef[] = [
  { id: "assistant", label: "Ассистент", icon: MessagesSquare },
  { id: "media", label: "Медиа", icon: Sparkles },
  { id: "site", label: "Сайт", icon: LayoutTemplate },
];

interface ShowcaseTabsProps {
  activeTab: ShowcaseTab;
  onChange: (tab: ShowcaseTab) => void;
  isPaused: boolean;
  autoplayMs: number;
  cycleKey: number;
}

export function ShowcaseTabs({ activeTab, onChange, isPaused, autoplayMs, cycleKey }: ShowcaseTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [box, setBox] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    const parent = containerRef.current;
    if (!el || !parent) return;
    const elR = el.getBoundingClientRect();
    const pR = parent.getBoundingClientRect();
    setBox({ left: elR.left - pR.left, width: elR.width });
  }, [activeTab]);

  const onKey = (e: React.KeyboardEvent) => {
    const idx = TABS.findIndex((t) => t.id === activeTab);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      onChange(TABS[(idx + 1) % TABS.length].id);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onChange(TABS[(idx - 1 + TABS.length) % TABS.length].id);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(TABS[0].id);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(TABS[TABS.length - 1].id);
    }
  };

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label="Продукты botme"
      onKeyDown={onKey}
      className="relative flex w-full border-b"
      style={{ borderColor: "var(--border-dark)" }}
    >
      {TABS.map((t) => {
        const active = t.id === activeTab;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls="showcase-panel"
            id={`tab-${t.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            className="group relative flex flex-1 items-center justify-center gap-2 px-3 py-3 text-[13px] font-medium transition-colors sm:flex-none sm:px-6 sm:py-4 sm:text-[15px]"
            style={{ color: active ? "var(--ink-dark)" : "var(--ink-dark-muted)" }}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            <span>{t.label}</span>
            {t.soon && (
              <span
                className="ml-1 rounded font-mono text-[10px]"
                style={{
                  background: "var(--bg-soft)",
                  color: "var(--ink-dark-subtle)",
                  border: "1px solid var(--border-dark)",
                  padding: "2px 6px",
                }}
              >
                soon
              </span>
            )}
          </button>
        );
      })}

      {/* Animated indicator */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -bottom-px h-[2px]"
        style={{ background: "var(--accent)" }}
        animate={{ left: box.left, width: box.width }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
      />

      {/* Autoplay progress */}
      {!isPaused && box.width > 0 && (
        <span
          key={`progress-${activeTab}-${cycleKey}`}
          aria-hidden
          className="pointer-events-none absolute -bottom-px"
          style={{
            left: box.left,
            width: box.width,
            height: 2,
            background: "var(--accent)",
            opacity: 0.3,
            transformOrigin: "left center",
            animation: `showcase-progress ${autoplayMs}ms linear forwards`,
          }}
        />
      )}

      <style>{`
        @keyframes showcase-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
