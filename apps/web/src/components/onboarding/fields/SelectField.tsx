import { cn } from "@/lib/utils";
import type { FieldOption } from "@/lib/onboarding/types";

interface Props {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FieldOption[];
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  error?: string;
}

export function SelectField({
  name,
  label,
  value,
  onChange,
  options,
  placeholder,
  helperText,
  required,
  error,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-[14px] font-medium text-ink-dark">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>
      {helperText && (
        <p className="text-[13px] leading-[1.5] text-ink-dark-muted">{helperText}</p>
      )}
      <select
        id={name}
        name={name}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-12 rounded-[10px] border bg-bg-elevated px-3 text-[14px] text-ink-dark outline-none transition-colors duration-200",
          "border-border-dark hover:border-border-dark-strong focus:border-accent focus:border-2",
          error && "!border-[#E5484D]",
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-[12px] text-[#E5484D]">{error}</p>}
    </div>
  );
}
