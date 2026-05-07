/**
 * MockPostCard — квадратная карточка поста для соцсетей.
 * Используется и в Hero-коллаже, и в showcase-grid /media.
 */
import { AtSign } from "lucide-react";
import { cn } from "@/lib/utils";

export type MockStyle = "warm" | "minimal" | "dark" | "bright";

interface MockPostCardProps {
  title: string;
  author: string;
  handle: string;
  style: MockStyle;
  timestamp?: string;
  className?: string;
}

const styleBg: Record<MockStyle, string> = {
  warm: "linear-gradient(135deg, #2A2418 0%, #1A1612 100%)",
  minimal: "var(--bg-elevated)",
  dark: "var(--bg-base)",
  bright:
    "linear-gradient(135deg, rgba(197,240,74,0.30) 0%, rgba(197,240,74,0.10) 100%)",
};

export function MockPostCard({
  title,
  author,
  handle,
  style,
  timestamp,
  className,
}: MockPostCardProps) {
  const onBright = style === "bright";
  const titleColor = onBright ? "var(--bg-base)" : "var(--ink-dark)";
  const subtleColor = onBright ? "rgba(10,10,11,0.7)" : "var(--ink-dark-muted)";

  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-2xl border p-4 sm:p-6",
        "flex flex-col justify-between",
        className,
      )}
      style={{
        background: styleBg[style],
        borderColor: "var(--border-dark)",
      }}
    >
      {/* warm: accent dot top-right */}
      {style === "warm" && (
        <div
          aria-hidden
          className="pointer-events-none absolute right-4 top-4 h-2 w-2 rounded-full"
          style={{ background: "var(--accent)", opacity: 0.6 }}
        />
      )}
      {/* minimal: thin diagonal accent line bottom-right */}
      {style === "minimal" && (
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-32 rotate-[-30deg]"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--accent) 80%)",
            opacity: 0.18,
          }}
        />
      )}
      {/* dark: accent radial bottom-left */}
      {style === "dark" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 0% 100%, rgba(197,240,74,0.10), transparent 60%)",
          }}
        />
      )}

      <div
        className="relative font-mono text-[10px] uppercase"
        style={{ color: subtleColor, letterSpacing: "0.05em" }}
      >
        {timestamp ?? ""}
      </div>

      <h3
        className="relative font-display font-semibold text-[16px] sm:text-[22px]"
        style={{
          color: titleColor,
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          whiteSpace: "pre-line",
        }}
      >
        {title}
      </h3>

      <div className="relative flex items-end justify-between">
        <div>
          <div
            className="text-[13px] font-medium"
            style={{ color: titleColor }}
          >
            {author}
          </div>
          <div
            className="mt-0.5 font-mono text-[11px]"
            style={{ color: subtleColor }}
          >
            {handle}
          </div>
        </div>
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{
            background: "rgba(197,240,74,0.20)",
            border: "1px solid rgba(197,240,74,0.40)",
          }}
        >
          <AtSign className="h-3 w-3" style={{ color: "var(--accent)" }} />
        </div>
      </div>
    </div>
  );
}
