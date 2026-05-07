import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import type { FieldOption } from "@/lib/onboarding/types";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options?: FieldOption[];
  helperText?: string;
  required?: boolean;
  error?: string;
}

const DEFAULTS: FieldOption[] = [
  {
    value: "friendly",
    label: "Дружелюбный",
    description: "Тёплый, на ты, с эмодзи",
    example: "Здравствуйте! Расскажите, что ищете — помогу подобрать",
  },
  {
    value: "neutral",
    label: "Нейтральный",
    description: "Сдержанный, на вы",
    example: "Здравствуйте. Чем можем помочь?",
  },
  {
    value: "business",
    label: "Деловой",
    description: "Формальный, без воды",
    example: "Добрый день. Опишите запрос, обработаем в порядке очереди.",
  },
  {
    value: "energetic",
    label: "Энергичный",
    description: "Бодрый, короткий",
    example: "Привет! Готов помочь — что нужно?",
  },
];

export function ToneField({
  label,
  value,
  onChange,
  options,
  helperText,
  required,
  error,
}: Props) {
  const items = options && options.length ? options : DEFAULTS;
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
        {items.map((o) => {
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
              <div>
                <div className="text-[16px] font-medium text-ink-dark">{o.label}</div>
                {o.description && (
                  <p className="mt-1 text-[13px] leading-[1.5] text-ink-dark-muted">
                    {o.description}
                  </p>
                )}
              </div>
              {o.example && (
                <div className="max-w-[90%] rounded-[10px] rounded-bl-[4px] bg-bg-soft px-3 py-2.5 text-[13px] text-ink-dark">
                  {o.example}
                </div>
              )}
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
