import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  canGoBack: boolean;
  isLastStep: boolean;
  isOptionalStep: boolean;
  isAuthStep?: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip?: () => void;
  finishCtaLabel: string;
  isLoading?: boolean;
}

export function WizardFooter({
  canGoBack,
  isLastStep,
  isOptionalStep,
  isAuthStep,
  onBack,
  onNext,
  onSkip,
  finishCtaLabel,
  isLoading,
}: Props) {
  const isFinish = isLastStep;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        "fixed inset-x-0 bottom-0 z-40 border-t border-border-dark bg-bg-base/95 px-4 py-3 backdrop-blur",
        "md:static md:inset-auto md:mt-12 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none",
      )}
    >
      <div>
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 items-center gap-1.5 rounded-[10px] border border-border-dark-strong bg-transparent px-5 text-[14px] text-ink-dark transition-colors hover:bg-bg-soft"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Назад
          </button>
        ) : (
          <span />
        )}
      </div>
      <div className="flex items-center gap-2">
        {isOptionalStep && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-[13px] text-ink-dark-muted transition-colors hover:text-ink-dark"
          >
            Пропустить
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={isLoading}
          className={cn(
            "inline-flex items-center gap-2 rounded-[10px] bg-accent font-medium text-bg-base outline-none transition-all duration-200",
            "hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-accent",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100",
            isAuthStep && isFinish
              ? "h-14 px-7 text-[16px] shadow-[0_0_32px_-8px_var(--accent)]"
              : "h-11 px-6 text-[14px]",
          )}
        >
          {isLoading ? (
            <>
              <span>Сохраняем</span>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </>
          ) : (
            <>
              {isAuthStep && isFinish && <Sparkles className="h-4 w-4" strokeWidth={2} />}
              <span>{isFinish ? finishCtaLabel : "Далее"}</span>
              {!isFinish && <ArrowRight className="h-3.5 w-3.5" />}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

