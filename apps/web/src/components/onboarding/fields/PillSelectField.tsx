import { cn } from "@/lib/utils";
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

export function PillSelectField({
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
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              type="button"
              key={o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                "rounded-full border px-4 py-2.5 text-[14px] transition-all duration-[180ms] outline-none",
                "focus-visible:ring-2 focus-visible:ring-accent",
                selected
                  ? "border-accent/50 bg-accent/15 font-medium text-ink-dark"
                  : "border-border-dark text-ink-dark-muted hover:border-border-dark-strong hover:text-ink-dark",
              )}
              aria-pressed={selected}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1 text-[12px] text-[#E5484D]">{error}</p>}
    </div>
  );
}
