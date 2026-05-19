/**
 * Phase 12D — switch between SMB simple and advanced operator runtime.
 */
import { useEffect, useState } from "react";
import { getRuntimeUxMode, setRuntimeUxMode, type RuntimeUxMode } from "@/lib/product/runtime-ux-mode";
import { cn } from "@/lib/utils";

export function RuntimeUxModeToggle(props: { className?: string }) {
  const [mode, setMode] = useState<RuntimeUxMode>("simple");

  useEffect(() => {
    setMode(getRuntimeUxMode());
    const onChange = () => setMode(getRuntimeUxMode());
    window.addEventListener("bm:runtime-ux-mode", onChange);
    return () => window.removeEventListener("bm:runtime-ux-mode", onChange);
  }, []);

  const LABEL: Record<RuntimeUxMode, string> = {
    simple: "Простой",
    advanced: "Расширенный",
  };

  return (
    <div
      className={cn("inline-flex rounded-lg border border-white/15 bg-black/30 p-0.5 text-xs", props.className)}
      role="group"
      aria-label="Режим отображения"
    >
      {(["simple", "advanced"] as const).map((m) => (
        <button
          key={m}
          type="button"
          className={cn(
            "rounded-md px-2.5 py-1 transition-colors",
            mode === m ? "bg-lime-400/90 text-black" : "text-white/60 hover:text-white",
          )}
          onClick={() => {
            setRuntimeUxMode(m);
            setMode(m);
          }}
        >
          {LABEL[m]}
        </button>
      ))}
    </div>
  );
}
