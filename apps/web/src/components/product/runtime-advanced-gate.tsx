import { useEffect, useState, type ReactNode } from "react";
import { isRuntimeAdvancedMode } from "@/lib/product/runtime-ux-mode";

/** Renders children only in advanced runtime UX mode. */
export function RuntimeAdvancedGate(props: { children: ReactNode; fallback?: ReactNode }) {
  const [advanced, setAdvanced] = useState(isRuntimeAdvancedMode());

  useEffect(() => {
    const sync = () => setAdvanced(isRuntimeAdvancedMode());
    sync();
    window.addEventListener("bm:runtime-ux-mode", sync);
    return () => window.removeEventListener("bm:runtime-ux-mode", sync);
  }, []);

  if (!advanced) return props.fallback ?? null;
  return props.children;
}
