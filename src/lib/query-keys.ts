/**
 * Централизованные query-keys для TanStack Query.
 * Единственный источник правды для invalidation.
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
  marketing: {
    caseStudies: ["marketing", "case-studies"] as const,
    caseBySlug: (slug: string) => ["marketing", "case", slug] as const,
    scenarioDetails: ["marketing", "scenario-details"] as const,
    scenarioByNiche: (niche: string) =>
      ["marketing", "scenario", niche] as const,
    integrations: ["marketing", "integrations"] as const,
    team: ["marketing", "team"] as const,
    legal: (slug: string) => ["marketing", "legal", slug] as const,
  },
  app: {
    assistants: ["app", "assistants"] as const,
    leads: ["app", "leads"] as const,
    kpi: ["app", "kpi"] as const,
    onboarding: ["app", "onboarding"] as const,
    dashboardKpis: ["app", "dashboard-kpis"] as const,
    activity: ["app", "activity"] as const,
    team: ["app", "team"] as const,
    notifications: ["app", "notifications"] as const,
    usage: ["app", "usage"] as const,
  },
  auth: {
    currentUser: ["auth", "current-user"] as const,
  },
};
