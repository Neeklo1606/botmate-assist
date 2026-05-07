import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  error?: string;
}

export function UrlField({
  name,
  label,
  value,
  onChange,
  placeholder = "https://...",
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
      <div className="relative">
        <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dark-subtle" />
        <input
          id={name}
          name={name}
          type="url"
          inputMode="url"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-12 w-full rounded-[10px] border bg-bg-elevated pl-9 pr-4 text-[14px] text-ink-dark placeholder:text-ink-dark-subtle outline-none transition-colors duration-200",
            "border-border-dark hover:border-border-dark-strong focus:border-accent focus:border-2",
            error && "!border-[#E5484D]",
          )}
        />
      </div>
      {error && <p className="mt-1 text-[12px] text-[#E5484D]">{error}</p>}
    </div>
  );
}
