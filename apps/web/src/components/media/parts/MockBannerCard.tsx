/**
 * MockBannerCard — горизонтальный баннер 16:9.
 */
import { cn } from "@/lib/utils";

type BannerStyle = "dark" | "warm" | "bright";

interface MockBannerCardProps {
  title: string;
  subtitle: string;
  style: BannerStyle;
  className?: string;
}

const styleBg: Record<BannerStyle, string> = {
  dark: "var(--bg-elevated)",
  warm: "linear-gradient(135deg, #2A2418 0%, #1A1612 100%)",
  bright:
    "linear-gradient(135deg, rgba(197,240,74,0.28) 0%, rgba(197,240,74,0.10) 100%)",
};

export function MockBannerCard({ title, subtitle, style, className }: MockBannerCardProps) {
  const onBright = style === "bright";
  const titleColor = onBright ? "var(--bg-base)" : "var(--ink-dark)";
  const subtleColor = onBright ? "rgba(10,10,11,0.7)" : "var(--ink-dark-muted)";

  return (
    <div
      className={cn(
        "relative toolbar-row overflow-hidden rounded-xl border p-5",
        className,
      )}
      style={{
        aspectRatio: "16 / 9",
        background: styleBg[style],
        borderColor: "var(--border-dark)",
      }}
    >
      <div className="flex flex-col">
        <div
          className="font-display text-[16px] font-semibold sm:text-[18px]"
          style={{ color: titleColor, letterSpacing: "-0.01em" }}
        >
          {title}
        </div>
        <div
          className="mt-1 font-mono text-[11px]"
          style={{ color: subtleColor }}
        >
          {subtitle}
        </div>
      </div>
      <div
        className="relative flex h-5 w-5 items-center justify-center rounded-full"
        style={{ border: "1px solid var(--accent)" }}
      >
        <div
          className="h-2 w-2 rounded-full"
          style={{ background: "var(--accent)" }}
        />
      </div>
    </div>
  );
}
