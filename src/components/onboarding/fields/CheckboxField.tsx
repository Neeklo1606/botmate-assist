/**
 * CheckboxField — для согласия с условиями. Поддерживает rich label с ссылками.
 */
import { Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  label: string;
  helperText?: string;
  required?: boolean;
  error?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  withLegalLinks?: boolean;
}

export function CheckboxField({
  name,
  label,
  helperText,
  error,
  value,
  onChange,
  withLegalLinks = true,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={name}
        className="flex cursor-pointer items-start gap-3 select-none"
      >
        <button
          id={name}
          type="button"
          role="checkbox"
          aria-checked={value}
          onClick={() => onChange(!value)}
          className={cn(
            "mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-[5px] border-2 transition-all",
            value
              ? "border-accent bg-accent"
              : "border-border-dark-strong bg-transparent hover:border-ink-dark-muted",
            error && !value && "border-danger",
          )}
        >
          {value && <Check className="h-3.5 w-3.5 text-bg-base" strokeWidth={3} />}
        </button>
        <span className="text-[14px] leading-[1.5] text-ink-dark">
          {withLegalLinks ? (
            <>
              Я соглашаюсь с{" "}
              <Link
                to="/legal/offer"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-accent underline-offset-2 hover:underline"
              >
                условиями использования
              </Link>{" "}
              и{" "}
              <Link
                to="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-accent underline-offset-2 hover:underline"
              >
                политикой конфиденциальности
              </Link>
            </>
          ) : (
            label
          )}
        </span>
      </label>
      {helperText && !error && (
        <p className="ml-8 text-[12px] text-ink-dark-muted">{helperText}</p>
      )}
      {error && <p className="ml-8 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
