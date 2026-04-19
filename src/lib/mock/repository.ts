/**
 * Repository абстракция (один интерфейс — две реализации).
 * Сейчас в проекте только mock; api-реализация подключается, когда
 * появится backend, без изменения хуков и компонентов.
 *
 * Использовать ТОЛЬКО через хуки из src/lib/hooks/*.
 */

import {
  assistants as mockAssistants,
  cases as mockCases,
  channels as mockChannels,
  faq as mockFaq,
  features as mockFeatures,
  kpi as mockKpi,
  leads as mockLeads,
  onboarding as mockOnboarding,
  pricing as mockPricing,
  scenarios as mockScenarios,
  trustLogos as mockTrust,
} from "./data";
import type {
  Assistant,
  CaseItem,
  Channel,
  FaqItem,
  FeatureItem,
  KpiSnapshot,
  Lead,
  OnboardingStep,
  PricingPlan,
  ScenarioItem,
  TrustLogo,
} from "@/types/entities";

export interface DemoRequestPayload {
  name: string;
  contact: string;
  niche: string;
}

export interface Repository {
  // Landing
  listChannels(): Promise<Channel[]>;
  listFeatures(): Promise<FeatureItem[]>;
  listScenarios(): Promise<ScenarioItem[]>;
  listPricing(): Promise<PricingPlan[]>;
  listFaq(): Promise<FaqItem[]>;
  listCases(): Promise<CaseItem[]>;
  listTrustLogos(): Promise<TrustLogo[]>;

  // Кабинет
  listAssistants(): Promise<Assistant[]>;
  listLeads(): Promise<Lead[]>;
  getKpi(): Promise<KpiSnapshot>;
  getOnboarding(): Promise<OnboardingStep[]>;

  // Mutations
  createDemoRequest(payload: DemoRequestPayload): Promise<{ id: string }>;
}

const wait = <T>(value: T, ms = 120) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

const mockRepository: Repository = {
  listChannels: () => wait(mockChannels),
  listFeatures: () => wait(mockFeatures),
  listScenarios: () => wait(mockScenarios),
  listPricing: () => wait(mockPricing),
  listFaq: () => wait(mockFaq),
  listCases: () => wait(mockCases),
  listTrustLogos: () => wait(mockTrust),

  listAssistants: () => wait(mockAssistants),
  listLeads: () => wait(mockLeads),
  getKpi: () => wait(mockKpi),
  getOnboarding: () => wait(mockOnboarding),

  createDemoRequest: async (payload) => {
    // mock-имитация: просто возвращаем сгенерированный id
    void payload;
    return wait({ id: `demo_${Date.now()}` }, 220);
  },
};

export const repository: Repository = mockRepository;
