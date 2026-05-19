/**
 * BotmeLogo — шрифтовой логотип с lime-точкой.
 * variant: "light" (default) — графит на светлом, "dark" — off-white на тёмном.
 * `inverse` — legacy alias (=> variant="dark").
 */
import { cn } from "@/lib/utils";

interface BotmeLogoProps {
  variant?: "light" | "dark";
  /** @deprecated используй variant="dark" */
  inverse?: boolean;
  className?: string;
}

export function BotmeLogo({ variant, inverse = false, className }: BotmeLogoProps) {
  const v = variant ?? (inverse ? "dark" : "light");
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-display text-[20px] font-semibold tracking-tight leading-none select-none",
        className,
      )}
      style={{ color: v === "dark" ? "var(--ink-dark)" : "var(--foreground)" }}
      aria-label="botme"
    >
      <span className="relative">
        botme
        <span
          aria-hidden
          className="absolute -top-[3px] right-[14px] h-[5px] w-[5px] rounded-full bg-accent"
        />
      </span>
    </span>
  );
}
