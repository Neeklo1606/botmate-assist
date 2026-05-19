/**
 * useOnboardingDraft — state + persistence для wizard'а.
 * sessionStorage; debounced save; шаг-валидация через step.validate.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OnboardingConfig, OnboardingDraft } from "@/lib/onboarding/types";
import { loadDraft, saveDraft } from "@/lib/onboarding/draft-store";

interface SubmitResult {
  success: boolean;
  draft: OnboardingDraft;
}

function makeEmpty(product: OnboardingConfig["product"]): OnboardingDraft {
  const now = new Date().toISOString();
  return {
    product,
    currentStepIndex: 0,
    data: {},
    startedAt: now,
    updatedAt: now,
  };
}

export function useOnboardingDraft(config: OnboardingConfig) {
  const [draft, setDraft] = useState<OnboardingDraft>(() => makeEmpty(config.product));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);

  // Initial load from storage.
  useEffect(() => {
    const existing = loadDraft(config.product);
    if (existing) {
      // Clamp stepIndex.
      const clamped = Math.min(
        Math.max(existing.currentStepIndex, 0),
        config.steps.length - 1,
      );
      setDraft({ ...existing, currentStepIndex: clamped });
    }
    mounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.product]);

  // Debounced save.
  useEffect(() => {
    if (!mounted.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDraft(config.product, draft);
    }, 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draft, config.product]);

  const totalSteps = config.steps.length;
  const currentStepIndex = draft.currentStepIndex;
  const currentStep = config.steps[currentStepIndex];

  const setField = useCallback((name: string, value: unknown) => {
    setDraft((d) => ({
      ...d,
      data: { ...d.data, [name]: value },
      updatedAt: new Date().toISOString(),
    }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), totalSteps - 1);
      setDraft((d) => ({ ...d, currentStepIndex: clamped }));
      setErrors({});
    },
    [totalSteps],
  );

  const nextStep = useCallback((): boolean => {
    const step = config.steps[currentStepIndex];
    if (!step) return false;
    const validationErrors = step.validate ? step.validate(draft.data) : null;
    if (validationErrors && Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return false;
    }
    setErrors({});
    if (currentStepIndex < totalSteps - 1) {
      setDraft((d) => ({ ...d, currentStepIndex: d.currentStepIndex + 1 }));
      return true;
    }
    return true;
  }, [config.steps, currentStepIndex, draft.data, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setDraft((d) => ({ ...d, currentStepIndex: d.currentStepIndex - 1 }));
      setErrors({});
    }
  }, [currentStepIndex]);

  const reset = useCallback(() => {
    const fresh = makeEmpty(config.product);
    setDraft(fresh);
    setErrors({});
  }, [config.product]);

  const submitDraft = useCallback(async (): Promise<SubmitResult> => {
    setIsLoading(true);
    try {
      // Заглушка — реальный submit в промпте 7.
      await new Promise((r) => setTimeout(r, 400));
      saveDraft(config.product, draft);
      return { success: true, draft };
    } finally {
      setIsLoading(false);
    }
  }, [draft, config.product]);

  return useMemo(
    () => ({
      draft,
      currentStep,
      currentStepIndex,
      totalSteps,
      data: draft.data,
      errors,
      isLoading,
      setField,
      goToStep,
      nextStep,
      prevStep,
      reset,
      submitDraft,
    }),
    [
      draft,
      currentStep,
      currentStepIndex,
      totalSteps,
      errors,
      isLoading,
      setField,
      goToStep,
      nextStep,
      prevStep,
      reset,
      submitDraft,
    ],
  );
}
