/**
 * Phase 11A — single vocabulary for governance overlays in execution inspector / workspace.
 */
import type { ExecutionGovernanceVisibility } from "@botmate/shared";
import type { ReactElement } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const OVERLAY_BADGE_CLASS: Record<string, string> = {
  HARD_BLOCK: "border-red-500/50 text-red-200",
  SOFT_BLOCK: "border-amber-500/45 text-amber-100",
  DEGRADED: "border-orange-500/45 text-orange-100",
  OBSERVE_ONLY: "border-sky-500/40 text-sky-100",
  RECOVERING: "border-violet-500/45 text-violet-100",
  SUPPRESSED: "border-zinc-500/45 text-zinc-200",
  REPLAY_RESTRICTED: "border-fuchsia-500/45 text-fuchsia-100",
};

const OVERLAY_LABEL: Record<string, string> = {
  HARD_BLOCK: "жёсткая блокировка",
  SOFT_BLOCK: "мягкая блокировка",
  DEGRADED: "снижена надёжность",
  OBSERVE_ONLY: "только наблюдение",
  RECOVERING: "восстановление",
  SUPPRESSED: "подавлено",
  REPLAY_RESTRICTED: "повтор ограничен",
};

function labelForOverlay(kind: string): string {
  return OVERLAY_LABEL[kind] ?? kind.replace(/_/g, " ").toLowerCase();
}

export interface GovernanceVisibilityRibbonProps {
  visibility: ExecutionGovernanceVisibility;
  className?: string;
}

export function GovernanceVisibilityRibbon(props: GovernanceVisibilityRibbonProps): ReactElement | null {
  const v = props.visibility;
  if (v.overlays.length === 0) return null;

  return (
    <div className={cn("space-y-1 rounded-md border border-white/10 bg-black/30 p-2", props.className)}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-white/45">Состояние политик</div>
      <div className="flex flex-wrap gap-1">
        {v.overlays.map((k) => (
          <Badge
            key={k}
            variant="outline"
            className={cn(
              "border font-mono text-[10px]",
              OVERLAY_BADGE_CLASS[k] ?? "border-white/15 text-white/55",
              v.dominantOverlay === k && "ring-1 ring-lime-400/35",
            )}
            title={v.reasons.find((r) => r.kind === k)?.code ?? k}
          >
            {labelForOverlay(k)}
            {v.dominantOverlay === k ? <span className="text-lime-200/90"> · основное</span> : null}
          </Badge>
        ))}
      </div>
    </div>
  );
}
