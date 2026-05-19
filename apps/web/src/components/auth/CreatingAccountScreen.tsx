/**
 * CreatingAccountScreen — fullscreen overlay показывается ~1.5с после
 * регистрации в финале брифа, до перехода в /app. Даёт ощущение процесса.
 */
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  "Регистрация",
  "Сохранение брифа",
  "Подготовка кабинета",
];

export function CreatingAccountScreen() {
  const [done, setDone] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setDone(1), 350);
    const t2 = setTimeout(() => setDone(2), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg-base px-6 text-center">
      <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-accent/15 [animation:pulse_2s_ease-in-out_infinite]"
        />
        <span
          aria-hidden
          className="absolute inset-4 rounded-full bg-accent/25"
        />
        <Loader2 className="relative h-10 w-10 animate-spin text-accent" strokeWidth={2} />
      </div>
      <h2 className="font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink-dark md:text-[32px]">
        Создаём твой аккаунт…
      </h2>
      <ul className="mt-6 flex flex-col gap-2 text-left">
        {STEPS.map((label, i) => {
          const isDone = i < done;
          const isCurrent = i === done;
          return (
            <li
              key={label}
              className="flex items-center gap-3 text-[14px] text-ink-dark-muted"
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                  isDone
                    ? "bg-accent text-bg-base"
                    : isCurrent
                      ? "bg-accent/20 text-accent"
                      : "bg-bg-soft text-ink-dark-subtle"
                }`}
              >
                {isDone ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : isCurrent ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span className={isDone || isCurrent ? "text-ink-dark" : ""}>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
