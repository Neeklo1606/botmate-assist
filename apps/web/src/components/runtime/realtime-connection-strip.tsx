import type { ReactElement } from "react";
import { WifiOff } from "lucide-react";
import { useCabinetRealtimeConnectionState } from "@/lib/realtime/use-cabinet-realtime";
import { realtimeFlagEnabled } from "@/lib/realtime/realtime-config";
import { CABINET_RU } from "@/lib/i18n/cabinet-ru";
import { cn } from "@/lib/utils";

export function RealtimeConnectionStrip(props: { className?: string }): ReactElement | null {
  const state = useCabinetRealtimeConnectionState();
  if (!realtimeFlagEnabled()) return null;
  if (state.connected) return null;

  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
        state.reconnecting ?
          "border-amber-500/35 bg-amber-950/30 text-amber-100"
        : "border-red-500/35 bg-red-950/25 text-red-100",
        props.className,
      )}
    >
      <WifiOff className="size-3.5 shrink-0 opacity-80" aria-hidden />
      <span>{state.reconnecting ? CABINET_RU.realtime.reconnecting : CABINET_RU.realtime.offline}</span>
    </div>
  );
}
