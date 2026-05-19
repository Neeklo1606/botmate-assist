/**
 * draft-store — sessionStorage wrapper для onboarding-draft'ов.
 * Per-product ключи. Все операции защищены try/catch (private mode browser).
 */
import type { OnboardingDraft, OnboardingProduct } from "./types";

const key = (p: OnboardingProduct) => `botme:onboarding:${p}`;

function safeStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveDraft(product: OnboardingProduct, draft: OnboardingDraft): void {
  const s = safeStorage();
  if (!s) return;
  try {
    s.setItem(key(product), JSON.stringify(draft));
  } catch {
    /* noop */
  }
}

export function loadDraft(product: OnboardingProduct): OnboardingDraft | null {
  const s = safeStorage();
  if (!s) return null;
  try {
    const raw = s.getItem(key(product));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingDraft;
    if (parsed && parsed.product === product && typeof parsed.currentStepIndex === "number") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearDraft(product: OnboardingProduct): void {
  const s = safeStorage();
  if (!s) return;
  try {
    s.removeItem(key(product));
  } catch {
    /* noop */
  }
}

export function hasDraft(product: OnboardingProduct): boolean {
  return loadDraft(product) !== null;
}
