/**
 * Централизованные query-keys для TanStack Query.
 * Используем массивный формат — единственный источник правды для invalidation.
 */

export const qk = {
  landing: {
    channels: ["landing", "channels"] as const,
    features: ["landing", "features"] as const,
    scenarios: ["landing", "scenarios"] as const,
    pricing: ["landing", "pricing"] as const,
    pricingComparison: ["landing", "pricing-comparison"] as const,
    faq: ["landing", "faq"] as const,
    cases: ["landing", "cases"] as const,
    trust: ["landing", "trust"] as const,
    benefits: ["landing", "benefits"] as const,
    how: ["landing", "how"] as const,
    heroChat: ["landing", "hero-chat"] as const,
  },
  first100: {
    stats: ["first100", "stats"] as const,
    benefits: ["first100", "benefits"] as const,
    math: ["first100", "math"] as const,
  },
  app: {
    assistants: ["app", "assistants"] as const,
    leads: ["app", "leads"] as const,
    kpi: ["app", "kpi"] as const,
    onboarding: ["app", "onboarding"] as const,
  },
};
