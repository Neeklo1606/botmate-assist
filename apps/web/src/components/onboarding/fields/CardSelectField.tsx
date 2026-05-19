import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import type { FieldOption } from "@/lib/onboarding/types";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FieldOption[];
  helperText?: string;
  required?: boolean;
  error?: string;
}

function getIcon(name?: string): LucideIcon {
  if (!name) return Icons.Square;
  const Comp = (Icons as unknown as Record<string, LucideIcon>)[name];
  return Comp ?? Icons.Square;
}

export function CardSelectField({
  label,
  value,
  onChange,
  options,
  helperText,
  required,
  error,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[14px] font-medium text-ink-dark">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </span>
      {helperText && (
        <p className="text-[13px] leading-[1.5] text-ink-dark-muted">{helperText}</p>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {options.map((o) => {
          const Icon = getIcon(o.icon);
          const selected = value === o.value;
          return (
            <button
              type="button"
              key={o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                "relative flex flex-col gap-3 rounded-[14px] border-2 bg-bg-elevated p-5 text-left transition-all duration-[180ms] outline-none",
                "focus-visible:ring-2 focus-visible:ring-accent",
                selected
                  ? "border-accent"
                  : "border-border-dark hover:-translate-y-px hover:border-border-dark-strong",
              )}
              aria-pressed={selected}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-[10px] border transition-colors",
                  selected
                    ? "border-accent/30 bg-accent/15"
                    : "border-border-dark bg-bg-soft",
                )}
              >
                <Icon className={cn("h-5 w-5", selected ? "text-accent" : "text-ink-dark")} />
              </span>
              <div>
                <div className="text-[16px] font-medium text-ink-dark">{o.label}</div>
                {o.description && (
                  <p className="mt-1 text-[13px] leading-[1.5] text-ink-dark-muted">
                    {o.description}
                  </p>
                )}
              </div>
              {selected && (
                <CheckCircle2 className="absolute right-3 top-3 h-[18px] w-[18px] text-accent" />
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1 text-[12px] text-[#E5484D]">{error}</p>}
    </div>
  );
}
