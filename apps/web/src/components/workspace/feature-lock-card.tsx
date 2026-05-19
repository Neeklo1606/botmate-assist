import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import type { TenantPlanTier } from "@botmate/shared";
import { CABINET_RU } from "@/lib/i18n/cabinet-ru";
import { Button } from "@/components/ui/button";
import { PlanTierBadge } from "@/components/workspace/plan-tier-badge";

const UPGRADE_TARGET: Record<TenantPlanTier, TenantPlanTier | null> = {
  starter: "pro",
  pro: "enterprise",
  enterprise: null,
};

export function FeatureLockCard(props: {
  title: string;
  description: string;
  currentTier: TenantPlanTier;
  requiredTier: TenantPlanTier;
}) {
  const upgrade = UPGRADE_TARGET[props.currentTier];
  if (props.currentTier === props.requiredTier || props.currentTier === "enterprise") {
    return null;
  }

  return (
    <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-white">{props.title}</h3>
            <PlanTierBadge tier={props.requiredTier} />
          </div>
          <p className="text-xs text-white/55">{props.description}</p>
          {upgrade ?
            <Button variant="brand" size="sm" asChild>
              <Link to="/workspace">{CABINET_RU.common.viewPlan}</Link>
            </Button>
          : null}
        </div>
      </div>
    </section>
  );
}
