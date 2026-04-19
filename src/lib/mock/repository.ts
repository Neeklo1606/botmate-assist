/**
 * Repository абстракция (один интерфейс — две реализации).
 * Сейчас в проекте только mock; api-реализация подключается, когда
 * появится backend, без изменения хуков и компонентов.
 *
 * Persistence: in-memory (module-level). Состояние живёт пока вкладка
 * открыта. На SSR данные изолированы по запросу через фабрику router'а.
 *
 * Использовать ТОЛЬКО через хуки из src/lib/hooks/*.
 */

import {
  assistants as seedAssistants,
  benefits as seedBenefits,
  cases as seedCases,
  channels as seedChannels,
  faq as seedFaq,
  features as seedFeatures,
  first100Benefits as seedFirst100Benefits,
  first100Math as seedFirst100Math,
  first100Stats as seedFirst100Stats,
  heroChat as seedHeroChat,
  howItWorks as seedHowItWorks,
  kpi as seedKpi,
  leads as seedLeads,
  onboarding as seedOnboarding,
  pricing as seedPricing,
  pricingComparison as seedPricingComparison,
  scenarios as seedScenarios,
  trustLogos as seedTrust,
} from "./data";
import type {
  Assistant,
  BenefitItem,
  CaseItem,
  Channel,
  ChatMessage,
  FaqItem,
  FeatureItem,
  First100Benefit,
  First100MathRow,
  First100Stats,
  HowItWorksStep,
  KpiSnapshot,
  Lead,
  OnboardingStep,
  PricingComparisonRow,
  PricingPlan,
  ScenarioItem,
  TrustLogo,
} from "@/types/entities";

export interface DemoRequestPayload {
  name: string;
  contact: string;
  niche: string;
  source?: "landing" | "first-100" | "pricing" | "contacts";
}

export interface Repository {
  // Landing
  listChannels(): Promise<Channel[]>;
  listFeatures(): Promise<FeatureItem[]>;
  listScenarios(): Promise<ScenarioItem[]>;
  listPricing(): Promise<PricingPlan[]>;
  listPricingComparison(): Promise<PricingComparisonRow[]>;
  listFaq(): Promise<FaqItem[]>;
  listCases(): Promise<CaseItem[]>;
  listTrustLogos(): Promise<TrustLogo[]>;
  listBenefits(): Promise<BenefitItem[]>;
  listHowItWorks(): Promise<HowItWorksStep[]>;
  getHeroChat(): Promise<ChatMessage[]>;

  // First 100
  getFirst100Stats(): Promise<First100Stats>;
  listFirst100Benefits(): Promise<First100Benefit[]>;
  listFirst100Math(): Promise<First100MathRow[]>;

  // Кабинет (используются позже)
  listAssistants(): Promise<Assistant[]>;
  listLeads(): Promise<Lead[]>;
  getKpi(): Promise<KpiSnapshot>;
  getOnboarding(): Promise<OnboardingStep[]>;

  // Mutations
  createDemoRequest(payload: DemoRequestPayload): Promise<{ id: string }>;
}

const wait = <T>(value: T, ms = 120) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

/**
 * In-memory state (module-level).
 * SSR-safe: каждый Worker-запрос получает свой модуль через фабрику router.
 */
const state = {
  demoRequests: [] as Array<DemoRequestPayload & { id: string; createdAt: string }>,
  first100: { ...seedFirst100Stats },
};

const mockRepository: Repository = {
  listChannels: () => wait(seedChannels),
  listFeatures: () => wait(seedFeatures),
  listScenarios: () => wait(seedScenarios),
  listPricing: () => wait(seedPricing),
  listPricingComparison: () => wait(seedPricingComparison),
  listFaq: () => wait(seedFaq),
  listCases: () => wait(seedCases),
  listTrustLogos: () => wait(seedTrust),
  listBenefits: () => wait(seedBenefits),
  listHowItWorks: () => wait(seedHowItWorks),
  getHeroChat: () => wait(seedHeroChat),

  getFirst100Stats: () => wait(state.first100),
  listFirst100Benefits: () => wait(seedFirst100Benefits),
  listFirst100Math: () => wait(seedFirst100Math),

  listAssistants: () => wait(seedAssistants),
  listLeads: () => wait(seedLeads),
  getKpi: () => wait(seedKpi),
  getOnboarding: () => wait(seedOnboarding),

  createDemoRequest: async (payload) => {
    const id = `demo_${Date.now()}`;
    state.demoRequests.push({
      ...payload,
      id,
      createdAt: new Date().toISOString(),
    });
    // Если заявка из first-100 — сдвигаем счётчик (но не больше total)
    if (payload.source === "first-100" && state.first100.taken < state.first100.total) {
      state.first100 = { ...state.first100, taken: state.first100.taken + 1 };
    }
    return wait({ id }, 220);
  },
};

export const repository: Repository = mockRepository;
