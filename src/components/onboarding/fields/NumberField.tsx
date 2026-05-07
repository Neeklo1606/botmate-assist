import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  error?: string;
  min?: number;
  max?: number;
}

export function NumberField({
  name,
  label,
  value,
  onChange,
  helperText,
  required,
  error,
  min,
  max,
  placeholder,
}: Props) {
  const cur = typeof value === "number" ? value : 0;
  const dec = () => {
    const next = cur - 1;
    if (typeof min === "number" && next < min) return;
    onChange(next);
  };
  const inc = () => {
    const next = cur + 1;
    if (typeof max === "number" && next > max) return;
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-[14px] font-medium text-ink-dark">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>
      {helperText && (
        <p className="text-[13px] leading-[1.5] text-ink-dark-muted">{helperText}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={dec}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border-dark bg-bg-elevated text-ink-dark hover:border-border-dark-strong"
          aria-label="Уменьшить"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          id={name}
          name={name}
          type="number"
          inputMode="numeric"
          value={Number.isFinite(cur) ? cur : ""}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={placeholder}
          className={cn(
            "h-12 w-full flex-1 rounded-[10px] border bg-bg-elevated px-4 text-center text-[14px] text-ink-dark outline-none transition-colors duration-200 tabular-nums",
            "border-border-dark hover:border-border-dark-strong focus:border-accent focus:border-2",
            error && "!border-[#E5484D]",
          )}
        />
        <button
          type="button"
          onClick={inc}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border-dark bg-bg-elevated text-ink-dark hover:border-border-dark-strong"
          aria-label="Увеличить"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="mt-1 text-[12px] text-[#E5484D]">{error}</p>}
    </div>
  );
}
