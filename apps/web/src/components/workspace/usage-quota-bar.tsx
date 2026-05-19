import type { UsageQuotaItem } from "@botmate/shared";
import { cn } from "@/lib/utils";

export function UsageQuotaBar(props: { item: UsageQuotaItem }) {
  const { item } = props;
  const tone =
    item.atLimit ? "bg-red-500"
    : item.percent >= 85 ? "bg-amber-400"
    : "bg-lime-400";

  return (
    <div className="space-y-1.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
        <span className="text-white/80">{item.label}</span>
        <span className={cn("tabular-nums text-white/50", item.atLimit && "text-red-300")}>
          {item.used.toLocaleString()} / {item.limit.toLocaleString()}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={item.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={item.label}
      >
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${item.percent}%` }}
        />
      </div>
    </div>
  );
}
