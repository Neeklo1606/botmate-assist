import type { ReactElement } from "react";
import { webProductionConfigIssues } from "@/lib/production/config";

/** Shown when `VITE_PRODUCTION_STRICT=true` and mock/session modes are still enabled. */
export function ProductionModeBanner(): ReactElement | null {
  const issues = webProductionConfigIssues();
  if (issues.length === 0) return null;

  return (
    <div
      className="border-b border-amber-500/40 bg-amber-950/50 px-4 py-2 text-center text-xs text-amber-100"
      role="alert"
    >
      <span className="font-semibold text-amber-50">Production strict:</span>{" "}
      {issues.join(" · ")} — fix env before external launch.
    </div>
  );
}
