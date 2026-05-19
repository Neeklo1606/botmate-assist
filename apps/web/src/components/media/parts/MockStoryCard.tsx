/**
 * MockStoryCard — вертикальная сторис-карточка 9:16.
 */
import { cn } from "@/lib/utils";
import type { MockStyle } from "./MockPostCard";

type StoryStyle = Extract<MockStyle, "minimal" | "warm" | "bright">;

interface MockStoryCardProps {
  title: string;
  style: StoryStyle;
  cta: string;
  className?: string;
}

const styleBg: Record<StoryStyle, string> = {
  minimal: "var(--bg-elevated)",
  warm: "linear-gradient(160deg, #2A2418 0%, #1A1612 100%)",
  bright:
    "linear-gradient(180deg, rgba(197,240,74,0.28) 0%, rgba(197,240,74,0.10) 100%)",
};

export function MockStoryCard({ title, style, cta, className }: MockStoryCardProps) {
  const onBright = style === "bright";
  const titleColor = onBright ? "var(--bg-base)" : "var(--ink-dark)";
  const subtleColor = onBright ? "rgba(10,10,11,0.7)" : "var(--ink-dark-muted)";
  const subtleColorTop = onBright ? "rgba(10,10,11,0.55)" : "var(--ink-dark-subtle)";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[14px] border p-[18px]",
        "flex flex-col justify-between",
        className,
      )}
      style={{
        aspectRatio: "9 / 16",
        background: styleBg[style],
        borderColor: "var(--border-dark)",
      }}
    >
      {/* progress bars top */}
      <div className="absolute left-3 right-3 top-2 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[2px] flex-1 rounded-full"
            style={{
              background: i === 0 ? (onBright ? "var(--bg-base)" : "var(--ink-dark)") : "rgba(244,244,241,0.25)",
            }}
          />
        ))}
      </div>

      <div
        className="mt-3 font-mono text-[10px] uppercase"
        style={{ color: subtleColorTop, letterSpacing: "0.05em" }}
      >
        STORIES
      </div>

      <h4
        className="font-display font-semibold text-[14px] sm:text-[16px]"
        style={{
          color: titleColor,
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
          whiteSpace: "pre-line",
        }}
      >
        {title}
      </h4>

      <div
        className="font-mono text-[11px]"
        style={{ color: style === "minimal" ? "var(--accent)" : subtleColor }}
      >
        {cta}
      </div>

      {style === "minimal" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1"
          style={{ background: "rgba(197,240,74,0.30)" }}
        />
      )}
    </div>
  );
}
