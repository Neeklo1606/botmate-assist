/**
 * Единый источник доменных типов botme.
 * Используется во всех features, hooks, schemas и mock-repository.
 */

export type Niche =
  | "real_estate"
  | "auto"
  | "clinic"
  | "services"
  | "online_school"
  | "agency"
  | "other";

export type ChannelId =
  | "telegram"
  | "website"
  | "avito"
  | "vk"
  | "whatsapp"
  | "instagram";

export interface Channel {
  id: ChannelId;
  name: string;
  description: string;
  status: "live" | "beta" | "soon";
}

export type AssistantStatus = "draft" | "active" | "paused";

export interface Assistant {
  id: string;
  name: string;
  niche: Niche;
  status: AssistantStatus;
  channels: ChannelId[];
  conversations7d: number;
  leads7d: number;
  conversion: number; // 0..1
  updatedAt: string; // ISO
}

export type LeadStatus = "new" | "qualified" | "won" | "lost";

export interface Lead {
  id: string;
  assistantId: string;
  contact: string;
  channel: ChannelId;
  status: LeadStatus;
  summary: string;
  createdAt: string; // ISO
}

export interface KpiSnapshot {
  conversations: number;
  leads: number;
  qualified: number;
  conversion: number; // 0..1
  activeAssistants: number;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
}

/* ───── Landing ───── */

export interface PricingPlan {
  id: string;
  name: string;
  priceRub: number; // месячная цена в ₽
  tagline: string;
  features: string[];
  highlighted?: boolean;
  cta: { label: string; intent: "primary" | "secondary" };
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string; // имя lucide-иконки
}

export interface ScenarioItem {
  id: string;
  niche: Niche;
  title: string;
  bullet: string;
  metric: string; // напр. "+38% к конверсии в заявку"
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface CaseItem {
  id: string;
  company: string;
  niche: Niche;
  quote: string;
  author: string;
  metric: string;
}

export interface TrustLogo {
  id: string;
  name: string;
  initials: string; // используем для mock-логотипа
}

export type LandingSectionType =
  | "hero"
  | "trust"
  | "how"
  | "what"
  | "channels"
  | "scenarios"
  | "demo"
  | "benefits"
  | "launch"
  | "pricing"
  | "cases"
  | "faq"
  | "cta";

export interface LandingSection<T = unknown> {
  type: LandingSectionType;
  payload: T;
}
