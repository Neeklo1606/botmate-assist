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
    assistants: ["app", "assistants"] as const, // deprecated — prefer qk.assistants.list(...)
    /** @deprecated Prefer `qk.leads.*` — kept for stale cache compatibility only */
    leads: ["app", "leads"] as const,
    kpi: ["app", "kpi"] as const,
    onboarding: ["app", "onboarding"] as const,
    dashboardKpis: ["app", "dashboard-kpis"] as const,
    activity: ["app", "activity"] as const,
    team: ["app", "team"] as const,
    notifications: ["app", "notifications"] as const,
    usage: ["app", "usage"] as const,
    apiKeys: ["app", "api-keys"] as const,
  },
  auth: {
    currentUser: ["auth", "current-user"] as const,
  },
  assistants: {
    root: ["assistants"] as const,
    list: (tenantKey: string, userId: string) =>
      ["assistants", "list", tenantKey, userId] as const,
    detail: (tenantKey: string, userId: string, assistantId: string) =>
      ["assistants", "detail", tenantKey, userId, assistantId] as const,
  },
  projects: {
    root: ["projects"] as const,
    list: (tenantKey: string, userId: string) =>
      ["projects", "list", tenantKey, userId] as const,
    detail: (tenantKey: string, userId: string, projectId: string) =>
      ["projects", "detail", tenantKey, userId, projectId] as const,
  },
  leads: {
    root: ["leads"] as const,
    list: (tenantKey: string, userId: string) => ["leads", "list", tenantKey, userId] as const,
    detail: (tenantKey: string, userId: string, leadId: string) =>
      ["leads", "detail", tenantKey, userId, leadId] as const,
  },
  chat: {
    sessions: (tenantKey: string, userId: string) =>
      ["chat", "sessions", tenantKey, userId] as const,
    /** Prefix for all paginated message queries of a session */
    messagesForSession: (tenantKey: string, userId: string, sessionId: string) =>
      ["chat", "messages", tenantKey, userId, sessionId] as const,
    messages: (tenantKey: string, userId: string, sessionId: string, page: number, pageSize: number) =>
      ["chat", "messages", tenantKey, userId, sessionId, page, pageSize] as const,
  },
  workspace: {
    overview: ["workspace", "overview"] as const,
    usage: ["workspace", "usage"] as const,
    members: ["workspace", "members"] as const,
    supportDiagnostics: ["workspace", "support-diagnostics"] as const,
    entitlements: ["workspace", "entitlements"] as const,
    openAiStatus: ["workspace", "openai-status"] as const,
    onboarding: ["workspace", "onboarding"] as const,
    invites: ["workspace", "invites"] as const,
  },
  product: {
    activation: ["product", "activation"] as const,
  },
  knowledge: {
    bases: ["knowledge", "bases"] as const,
    documents: (baseId: string) => ["knowledge", "documents", baseId] as const,
  },
  runtime: {
    filtersHash(parts: Record<string, string | number | undefined>): string {
      const entries = Object.entries(parts)
        .filter(([, v]) => v !== undefined && v !== "")
        .sort(([a], [b]) => a.localeCompare(b));
      return JSON.stringify(Object.fromEntries(entries.map(([k, v]) => [k, String(v)])));
    },
    overview: (tenantKey: string) => ["runtime", "overview", tenantKey] as const,
    executions: (tenantKey: string, filtersHash: string) =>
      ["runtime", "executions", tenantKey, filtersHash] as const,
    execution: (tenantKey: string, executionId: string) =>
      ["runtime", "execution", tenantKey, executionId] as const,
    browserSessions: (tenantKey: string, filtersHash: string) =>
      ["runtime", "browser-sessions", tenantKey, filtersHash] as const,
    notifications: (tenantKey: string, filtersHash: string) =>
      ["runtime", "notifications", tenantKey, filtersHash] as const,
    policyEvents: (tenantKey: string, filtersHash: string) =>
      ["runtime", "policy-events", tenantKey, filtersHash] as const,
    queues: (tenantKey: string) => ["runtime", "queues", tenantKey] as const,
    timeline: (tenantKey: string, executionId: string, pageLimit: number) =>
      ["runtime", "timeline", tenantKey, executionId, "paged", pageLimit] as const,
    graph: (tenantKey: string, executionId: string) =>
      ["runtime", "graph", tenantKey, executionId] as const,
    facts: (tenantKey: string, executionId: string, filtersHash: string) =>
      ["runtime", "facts", tenantKey, executionId, filtersHash] as const,
    replayMatrix: (tenantKey: string, executionId: string) =>
      ["runtime", "replay-matrix", tenantKey, executionId] as const,
    artifacts: (tenantKey: string, filtersHash: string) =>
      ["runtime", "artifacts", tenantKey, filtersHash] as const,
    artifact: (tenantKey: string, artifactId: string) =>
      ["runtime", "artifact", tenantKey, artifactId] as const,
    consistency: (tenantKey: string) => ["runtime", "consistency", tenantKey] as const,
    /** Append-only bounded deque — hydrated via WS merges (`mergeAppendRuntimeActivityStream`). */
    activityStream: (tenantKey: string) => ["runtime", "activity-stream", tenantKey] as const,
    activityFacts: (tenantKey: string, filtersHash: string) =>
      ["runtime", "activity-facts", tenantKey, filtersHash] as const,
    incidents: (tenantKey: string, filtersHash: string) =>
      ["runtime", "incidents", tenantKey, filtersHash] as const,
    executionNotes: (tenantKey: string, executionId: string, filtersHash: string) =>
      ["runtime", "execution-notes", tenantKey, executionId, filtersHash] as const,
  },
};
