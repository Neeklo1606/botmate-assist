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

export type PricingPeriod = "monthly" | "yearly";

export interface PricingPlan {
  id: string;
  name: string;
  priceRub: number; // месячная цена в ₽ (при monthly)
  yearlyDiscount?: number; // 0..1
  tagline: string;
  forWho: string;
  features: string[];
  highlighted?: boolean;
  cta: { label: string; intent: "primary" | "secondary" };
}

export interface PricingComparisonRow {
  feature: string;
  values: { start: string; pro: string; max: string };
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
  category: "general" | "pricing" | "tech" | "security" | "integrations";
  question: string;
  answer: string;
}

export interface CaseItem {
  id: string;
  slug: string;
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

export interface BenefitItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface HowItWorksStep {
  id: string;
  number: string;
  title: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  time?: string; // "14:32"
}

export interface First100Stats {
  taken: number;
  total: number; // 100
}

export interface First100Benefit {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface First100MathRow {
  feature: string;
  regular: string;
  now: string;
}

/* ───── Sections (data-driven landing) ───── */

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

/* ───── User / Auth (mock) ───── */

export interface User {
  id: string;
  name: string;
  username: string; // @handle
  email: string;
  avatarInitials: string;
  workspaceName: string;
  role: "owner" | "admin" | "editor";
  plan: "start" | "growth" | "scale";
}

/* ───── Кейсы (детальные) ───── */

export interface CaseMetric {
  label: string;
  value: string;
  delta?: string; // "+38%", "−40%"
}

export interface CaseStudy {
  slug: string;
  company: string;
  niche: Niche;
  industry: string; // человеческое имя ниши
  region: string;
  summary: string;
  heroMetrics: CaseMetric[];
  task: string[]; // абзацы
  solution: string[]; // абзацы
  setup: { assistant: string; channels: ChannelId[]; integrations: string[] };
  resultMetrics: CaseMetric[];
  quote: { text: string; author: string; role: string };
  related: string[]; // slugs
}

/* ───── Сценарии / ниши (детальные) ───── */

export interface ScenarioDetail {
  niche: Niche;
  title: string; // "AI-ассистент для недвижимости"
  industry: string;
  pain: string;
  tasks: string[]; // 4-5 типовых задач
  dialog: ChatMessage[]; // mock-чат
  integrations: { name: string; description: string }[];
  caseSlug: string; // ref на /cases/$slug
}

/* ───── Команда, нотификации, usage (для /app) ───── */

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  status: "active" | "pending";
  initials: string;
  joinedAt: string;
}

export type NotificationKind =
  | "lead"
  | "channel_error"
  | "quota"
  | "billing"
  | "system";

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

export interface UsageStat {
  period: string; // "Апрель 2026"
  messages: { used: number; limit: number };
  assistants: { used: number; limit: number };
  channels: { used: number; limit: number };
  knowledgeMb: { used: number; limit: number };
}

/* ───── Dashboard charts ───── */

export interface ActivityPoint {
  date: string; // ISO date "2026-04-01"
  messages: number;
  leads: number;
}

export interface SparkPoint {
  x: number;
  y: number;
}

export interface DashboardKpi {
  label: string;
  value: string;
  trend: { delta: string; positive: boolean };
  spark: SparkPoint[];
  hint?: string;
}

/* ───── Legal ───── */

export interface LegalDocument {
  slug: "privacy" | "offer";
  title: string;
  version: string;
  updatedAt: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
}

/* ───── О команде ───── */

export interface TeamPerson {
  id: string;
  name: string;
  role: string;
  bio: string;
  initials: string;
}

/* ───── Интеграции (CRM и системы) ───── */

export interface Integration {
  id: string;
  name: string;
  category: "crm" | "data" | "automation";
  description: string;
  initials: string;
  status: "live" | "beta" | "soon";
}
