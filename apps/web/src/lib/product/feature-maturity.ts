/** Phase 12D — UX maturity labels (not a platform abstraction). */
export type FeatureMaturity = "stable" | "beta" | "experimental" | "internal";

export const FEATURE_MATURITY_META: Record<
  FeatureMaturity,
  { label: string; className: string; description: string }
> = {
  stable: {
    label: "Stable",
    className: "border-emerald-500/40 text-emerald-200 bg-emerald-500/10",
    description: "Supported for production customers.",
  },
  beta: {
    label: "Beta",
    className: "border-amber-500/40 text-amber-100 bg-amber-500/10",
    description: "Works with documented limits.",
  },
  experimental: {
    label: "Experimental",
    className: "border-fuchsia-500/40 text-fuchsia-100 bg-fuchsia-500/10",
    description: "May change; use for pilots only.",
  },
  internal: {
    label: "Internal",
    className: "border-white/20 text-white/50 bg-white/5",
    description: "Not for customer contracts.",
  },
};

export const RUNTIME_SURFACE_MATURITY = {
  overview: "stable",
  executions: "stable",
  executionDetail: "stable",
  browser: "beta",
  compare: "beta",
  incidents: "beta",
  operator: "experimental",
  consistency: "experimental",
  workspace: "beta",
  replayMatrix: "experimental",
} as const satisfies Record<string, FeatureMaturity>;
