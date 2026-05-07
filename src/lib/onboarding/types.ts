/**
 * Onboarding types — общий контракт wizard'а для всех продуктов.
 */
import type { ReactElement } from "react";

export type OnboardingProduct = "assistant" | "media" | "site";

export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "pill-single"
  | "pill-multi"
  | "card-single"
  | "card-multi"
  | "number"
  | "url"
  | "file-upload"
  | "color"
  | "tone";

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  example?: string;
}

export interface FieldDef {
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  options?: FieldOption[];
  min?: number;
  max?: number;
  rows?: number;
  /** Показать поле только если условие выполнено. */
  showIf?: (data: Record<string, unknown>) => boolean;
}

export interface WizardStepDef {
  id: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  validate?: (data: Record<string, unknown>) => Record<string, string> | null;
  optional?: boolean;
}

export interface OnboardingConfig {
  product: OnboardingProduct;
  title: string;
  estimatedMinutes: number;
  steps: WizardStepDef[];
  finishCta: string;
  /** Live-preview компонент справа от формы (desktop). */
  livePreviewComponent?: (props: { data: Record<string, unknown> }) => ReactElement;
}

export interface OnboardingDraft {
  product: OnboardingProduct;
  currentStepIndex: number;
  data: Record<string, unknown>;
  startedAt: string;
  updatedAt: string;
}
