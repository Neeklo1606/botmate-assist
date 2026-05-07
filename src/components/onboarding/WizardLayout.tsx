/**
 * WizardLayout — обёртка для брифа: mini-header + progress + step + footer-nav.
 * Управляет потоком (next/prev/submit) через useOnboardingDraft.
 */
import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { BotmeLogo } from "@/components/brand/botme-logo";
import { WizardProgress } from "./WizardProgress";
import { WizardFooter } from "./WizardFooter";
import { WizardStep } from "./WizardStep";
import { useOnboardingDraft } from "./hooks/useOnboardingDraft";
import type { OnboardingConfig } from "@/lib/onboarding/types";

interface Props {
  config: OnboardingConfig;
}

export function WizardLayout({ config }: Props) {
  const navigate = useNavigate();
  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    data,
    errors,
    isLoading,
    setField,
    nextStep,
    prevStep,
    submitDraft,
  } = useOnboardingDraft(config);

  const isLastStep = currentStepIndex >= totalSteps - 1;
  const canGoBack = currentStepIndex > 0;
  const isOptionalStep = !!currentStep?.optional;

  const handleNext = async () => {
    const ok = nextStep();
    if (!ok) return;
    if (isLastStep) {
      const result = await submitDraft();
      if (result.success) {
        await navigate({ to: "/onboarding/complete" });
      }
    }
  };

  const handleSkip = () => {
    if (isLastStep) {
      void submitDraft().then(() => navigate({ to: "/onboarding/complete" }));
    } else {
      // Bypass validation on optional skip.
      // Manually advance.
      handleNext();
    }
  };

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTextarea = target?.tagName === "TEXTAREA";
      if (e.key === "Enter" && !isTextarea && !e.shiftKey) {
        if (target?.tagName === "BUTTON") return;
        e.preventDefault();
        void handleNext();
      } else if (e.key === "Escape" && canGoBack) {
        prevStep();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex, isLastStep, canGoBack]);

  if (!currentStep) return null;

  const remainingMinutes = Math.max(
    1,
    Math.round(
      (config.estimatedMinutes * (totalSteps - currentStepIndex)) / Math.max(totalSteps, 1),
    ),
  );

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-ink-dark">
      {/* Mini-header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border-dark bg-bg-base/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="botme — на главную">
            <BotmeLogo variant="dark" className="text-[18px]" />
          </Link>
          <span className="hidden font-mono text-[12px] text-ink-dark-subtle md:inline">
            Бриф · {config.title}
          </span>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-dark-muted transition-colors hover:text-ink-dark"
          aria-label="Сохранить и выйти"
        >
          <span className="hidden md:inline">Сохранить и выйти</span>
          <X className="h-4 w-4 md:hidden" />
        </Link>
      </header>

      {/* Progress */}
      <WizardProgress
        currentIndex={currentStepIndex}
        total={totalSteps}
        estimatedMinutesLeft={remainingMinutes}
      />

      {/* Main */}
      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-4 pb-[100px] pt-8 md:px-6 md:pb-20 md:pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <WizardStep
              step={currentStep}
              data={data}
              errors={errors}
              setField={setField}
            />
          </motion.div>
        </AnimatePresence>

        <WizardFooter
          canGoBack={canGoBack}
          isLastStep={isLastStep}
          isOptionalStep={isOptionalStep}
          onBack={prevStep}
          onNext={handleNext}
          onSkip={isOptionalStep ? handleSkip : undefined}
          finishCtaLabel={config.finishCta}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
