/**
 * BotmeLogo — шрифтовой логотип с lime-точкой над "i".
 * Используется в хедере и футере. Поддерживает inverse для тёмных секций.
 */
import { cn } from "@/lib/utils";

interface BotmeLogoProps {
  inverse?: boolean;
  className?: string;
}

export function BotmeLogo({ inverse = false, className }: BotmeLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-display text-[20px] font-semibold tracking-tight leading-none select-none",
        inverse ? "text-background" : "text-foreground",
        className,
      )}
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
