/**
 * Repository абстракция (один интерфейс — две реализации).
 * Сейчас только mock; api-реализация подключится позже без изменения хуков.
 *
 * Persistence: in-memory (module-level).
 * SSR-safe: каждый Worker-запрос получает свой модуль через фабрику router.
 *
 * Использовать ТОЛЬКО через хуки из src/lib/hooks/*.
 */

import {
  activity30d as seedActivity,
  assistants as seedAssistants,
  benefits as seedBenefits,
  caseStudies as seedCaseStudies,
  cases as seedCases,
  channels as seedChannels,
  dashboardKpis as seedDashboardKpis,
  faq as seedFaq,
  features as seedFeatures,
  first100Benefits as seedFirst100Benefits,
  first100Math as seedFirst100Math,
  first100Stats as seedFirst100Stats,
  heroChat as seedHeroChat,
  howItWorks as seedHowItWorks,
  integrations as seedIntegrations,
  kpi as seedKpi,
  leads as seedLeads,
  legalDocs as seedLegalDocs,
  mockUser as seedMockUser,
  notifications as seedNotifications,
  onboarding as seedOnboarding,
  pricing as seedPricing,
  pricingComparison as seedPricingComparison,
  scenarioDetails as seedScenarioDetails,
  scenarios as seedScenarios,
  teamMembers as seedTeamMembers,
  teamPeople as seedTeamPeople,
  trustLogos as seedTrust,
  usageStat as seedUsageStat,
} from "./data";
import type {
  ActivityPoint,
  Assistant,
  BenefitItem,
  CaseItem,
  CaseStudy,
  Channel,
  ChatMessage,
  DashboardKpi,
  FaqItem,
  FeatureItem,
  First100Benefit,
  First100MathRow,
  First100Stats,
  HowItWorksStep,
  Integration,
  KpiSnapshot,
  Lead,
  LegalDocument,
  Niche,
  Notification,
  OnboardingStep,
  PricingComparisonRow,
  PricingPlan,
  ScenarioDetail,
  ScenarioItem,
  TeamMember,
  TeamPerson,
  TrustLogo,
  UsageStat,
  User,
} from "@/types/entities";

export interface DemoRequestPayload {
  name: string;
  contact: string;
  niche: string;
  source?: "landing" | "first-100" | "pricing" | "contacts";
}

export interface ContactRequestPayload {
  name: string;
  email: string;
  topic: string;
  message: string;
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

  // Marketing extras
  listCaseStudies(): Promise<CaseStudy[]>;
  getCaseBySlug(slug: string): Promise<CaseStudy | null>;
  listScenarioDetails(): Promise<ScenarioDetail[]>;
  getScenarioByNiche(niche: Niche): Promise<ScenarioDetail | null>;
  listIntegrations(): Promise<Integration[]>;
  listTeamPeople(): Promise<TeamPerson[]>;
  getLegalDoc(slug: "privacy" | "offer"): Promise<LegalDocument | null>;

  // Кабинет
  listAssistants(): Promise<Assistant[]>;
  listLeads(): Promise<Lead[]>;
  getKpi(): Promise<KpiSnapshot>;
  getOnboarding(): Promise<OnboardingStep[]>;
  listDashboardKpis(): Promise<DashboardKpi[]>;
  getActivity30d(): Promise<ActivityPoint[]>;
  listTeamMembers(): Promise<TeamMember[]>;
  listNotifications(): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
  getUsageStat(): Promise<UsageStat>;

  // Auth (mock)
  getCurrentUser(): Promise<User | null>;
  loginWithTelegram(): Promise<User>;
  logout(): Promise<void>;

  // Mutations
  createDemoRequest(payload: DemoRequestPayload): Promise<{ id: string }>;
  createContactRequest(payload: ContactRequestPayload): Promise<{ id: string }>;
}

const wait = <T>(value: T, ms = 120) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

/**
 * In-memory state. Живёт пока модуль существует.
 * SSR-safe через фабрику router.
 */
const state = {
  demoRequests: [] as Array<DemoRequestPayload & { id: string; createdAt: string }>,
  contactRequests: [] as Array<ContactRequestPayload & { id: string; createdAt: string }>,
  first100: { ...seedFirst100Stats },
  notifications: seedNotifications.map((n) => ({ ...n })),
  currentUser: null as User | null,
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

  listCaseStudies: () => wait(seedCaseStudies),
  getCaseBySlug: (slug) =>
    wait(seedCaseStudies.find((c) => c.slug === slug) ?? null),
  listScenarioDetails: () => wait(Object.values(seedScenarioDetails)),
  getScenarioByNiche: (niche) => wait(seedScenarioDetails[niche] ?? null),
  listIntegrations: () => wait(seedIntegrations),
  listTeamPeople: () => wait(seedTeamPeople),
  getLegalDoc: (slug) => wait(seedLegalDocs[slug] ?? null),

  listAssistants: () => wait(seedAssistants),
  listLeads: () => wait(seedLeads),
  getKpi: () => wait(seedKpi),
  getOnboarding: () => wait(seedOnboarding),
  listDashboardKpis: () => wait(seedDashboardKpis),
  getActivity30d: () => wait(seedActivity),
  listTeamMembers: () => wait(seedTeamMembers),
  listNotifications: () => wait(state.notifications),
  markNotificationRead: async (id) => {
    state.notifications = state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    await wait(undefined, 80);
  },
  markAllNotificationsRead: async () => {
    state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
    await wait(undefined, 80);
  },
  getUsageStat: () => wait(seedUsageStat),

  getCurrentUser: () => wait(state.currentUser),
  loginWithTelegram: async () => {
    state.currentUser = { ...seedMockUser };
    return wait(state.currentUser, 600);
  },
  logout: async () => {
    state.currentUser = null;
    await wait(undefined, 100);
  },

  createDemoRequest: async (payload) => {
    const id = `demo_${Date.now()}`;
    state.demoRequests.push({
      ...payload,
      id,
      createdAt: new Date().toISOString(),
    });
    if (payload.source === "first-100" && state.first100.taken < state.first100.total) {
      state.first100 = { ...state.first100, taken: state.first100.taken + 1 };
    }
    return wait({ id }, 220);
  },

  createContactRequest: async (payload) => {
    const id = `contact_${Date.now()}`;
    state.contactRequests.push({
      ...payload,
      id,
      createdAt: new Date().toISOString(),
    });
    return wait({ id }, 220);
  },
};

export const repository: Repository = mockRepository;
