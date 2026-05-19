import type { FeatureMaturity } from "@/lib/product/feature-maturity";
import { FEATURE_MATURITY_META } from "@/lib/product/feature-maturity";
import { cn } from "@/lib/utils";

export function FeatureMaturityBadge(props: {
  maturity: FeatureMaturity;
  className?: string;
  showTooltip?: boolean;
}) {
  const meta = FEATURE_MATURITY_META[props.maturity];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        meta.className,
        props.className,
      )}
      title={props.showTooltip !== false ? meta.description : undefined}
    >
      {meta.label}
    </span>
  );
}
