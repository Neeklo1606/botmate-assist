import type { TenantPlanTier } from "@botmate/shared";
import { planLabelRu } from "@/lib/i18n/cabinet-ru";
import { cn } from "@/lib/utils";

const STYLE: Record<TenantPlanTier, string> = {
  starter: "bg-white/10 text-white/70",
  pro: "bg-lime-400/15 text-lime-300",
  enterprise: "bg-violet-400/15 text-violet-200",
};

export function PlanTierBadge(props: { tier: TenantPlanTier; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        STYLE[props.tier],
        props.className,
      )}
    >
      {planLabelRu(props.tier)}
    </span>
  );
}
