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
  rows?: number;
}

export function TextareaField({
  name,
  label,
  value,
  onChange,
  placeholder,
  helperText,
  required,
  error,
  rows = 3,
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
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "rounded-[10px] border bg-bg-elevated px-4 py-3 text-[14px] text-ink-dark placeholder:text-ink-dark-subtle resize-none outline-none transition-[border-color,border-width] duration-200",
          "border-border-dark hover:border-border-dark-strong focus:border-accent focus:border-2",
          error && "!border-[#E5484D]",
        )}
      />
      {error && <p className="mt-1 text-[12px] text-[#E5484D]">{error}</p>}
    </div>
  );
}
