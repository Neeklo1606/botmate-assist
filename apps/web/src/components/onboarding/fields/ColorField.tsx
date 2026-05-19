import { cn } from "@/lib/utils";

interface Props {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  helperText?: string;
  required?: boolean;
  error?: string;
}

const PRESETS = ["#C5F04A", "#3B82F6", "#F97316", "#EC4899", "#10B981", "#8B5CF6"];

export function ColorField({
  name,
  label,
  value,
  onChange,
  helperText,
  required,
  error,
}: Props) {
  const cur = value || "";
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-[14px] font-medium text-ink-dark">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>
      {helperText && (
        <p className="text-[13px] leading-[1.5] text-ink-dark-muted">{helperText}</p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {PRESETS.map((c) => {
          const selected = cur.toLowerCase() === c.toLowerCase();
          return (
            <button
              type="button"
              key={c}
              onClick={() => onChange(c)}
              className={cn(
                "h-10 w-10 rounded-full border-2 transition-transform",
                selected ? "border-ink-dark scale-105" : "border-transparent",
              )}
              aria-label={c}
            >
              <span
                className="block h-full w-full rounded-full"
                style={{ backgroundColor: c }}
              />
            </button>
          );
        })}
        <div className="flex items-center gap-2">
          <span
            className="h-8 w-8 rounded-full border border-border-dark"
            style={{ backgroundColor: cur || "transparent" }}
          />
          <input
            id={name}
            name={name}
            type="text"
            value={cur}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className={cn(
              "h-10 w-32 rounded-[10px] border bg-bg-elevated px-3 text-[13px] text-ink-dark outline-none transition-colors",
              "border-border-dark focus:border-accent focus:border-2 font-mono",
              error && "!border-[#E5484D]",
            )}
          />
        </div>
      </div>
      {error && <p className="mt-1 text-[12px] text-[#E5484D]">{error}</p>}
    </div>
  );
}
