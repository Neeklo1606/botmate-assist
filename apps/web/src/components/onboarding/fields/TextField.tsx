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
  type?: string;
  inputMode?: "text" | "numeric" | "decimal" | "email" | "url";
}

export function TextField({
  name,
  label,
  value,
  onChange,
  placeholder,
  helperText,
  required,
  error,
  type = "text",
  inputMode,
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
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-12 rounded-[10px] border bg-bg-elevated px-4 text-[14px] text-ink-dark placeholder:text-ink-dark-subtle outline-none transition-[border-color,border-width] duration-200",
          "border-border-dark hover:border-border-dark-strong focus:border-accent focus:border-2",
          error && "!border-[#E5484D]",
        )}
        aria-invalid={!!error}
      />
      {error && <p className="mt-1 text-[12px] text-[#E5484D]">{error}</p>}
    </div>
  );
}
