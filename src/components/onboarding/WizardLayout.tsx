/**
 * WizardLayout — обёртка для брифа: mini-header + progress + step + footer-nav.
 * Управляет потоком (next/prev/submit) через useOnboardingDraft.
 *
 * На финальном шаге (kind="auth"): регистрируем пользователя, создаём project
 * из draft, чистим draft и редиректим в /app с CreatingAccountScreen overlay.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { BotmeLogo } from "@/components/brand/botme-logo";
import { WizardProgress } from "./WizardProgress";
import { WizardFooter } from "./WizardFooter";
import { WizardStep } from "./WizardStep";
import { useOnboardingDraft } from "./hooks/useOnboardingDraft";
import type { OnboardingConfig } from "@/lib/onboarding/types";
import { useBriefLogin } from "@/lib/auth/hooks";
import { useCreateProject } from "@/lib/projects/hooks";
import { clearDraft } from "@/lib/onboarding/draft-store";
import { CreatingAccountScreen } from "@/components/auth/CreatingAccountScreen";

interface Props {
  config: OnboardingConfig;
}

export function WizardLayout({ config }: Props) {
  const navigate = useNavigate();
  const briefLogin = useBriefLogin();
  const createProject = useCreateProject();
  const [creating, setCreating] = useState(false);
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
  } = useOnboardingDraft(config);

  const isLastStep = currentStepIndex >= totalSteps - 1;
  const canGoBack = currentStepIndex > 0 && !creating;
  const isOptionalStep = !!currentStep?.optional;
  const isAuthStep = currentStep?.kind === "auth";

  const handleNext = async () => {
    const ok = nextStep();
    if (!ok) return;
    if (isLastStep) {
      const name = (data.name as string) ?? "";
      const contact = (data.contact as string) ?? "";
      try {
        const { user } = await briefLogin({ name, contact });
        const projectId = await createProject(config.product, data, user);
        clearDraft(config.product);
        setCreating(true);
        setTimeout(() => {
          void navigate({
            to: "/projects/$projectId",
            params: { projectId },
          });
        }, 1500);
      } catch {
        toast.error("Не удалось создать аккаунт. Попробуйте ещё раз.");
      }
    }
  };

  const handleSkip = () => {
    if (!isLastStep) handleNext();
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
      <main className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col px-4 pb-[100px] pt-8 md:px-6 md:pb-20 md:pt-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,560px)_minmax(0,560px)] lg:gap-16">
          <div className="flex flex-col">
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
              isAuthStep={isAuthStep}
              onBack={prevStep}
              onNext={handleNext}
              onSkip={isOptionalStep ? handleSkip : undefined}
              finishCtaLabel={config.finishCta}
              isLoading={isLoading || creating}
            />
          </div>

          {config.livePreviewComponent && (
            <aside className="hidden lg:block">
              <div className="sticky top-32">
                <config.livePreviewComponent data={data} />
              </div>
            </aside>
          )}
        </div>
      </main>
      {creating && <CreatingAccountScreen />}
    </div>
  );
}
