/** Phase 12D — SMB simplified runtime vs advanced operator mode (client-only). */
export type RuntimeUxMode = "simple" | "advanced";

const STORAGE_KEY = "bm.runtime.ux_mode";

export function getRuntimeUxMode(): RuntimeUxMode {
  if (typeof window === "undefined") return "simple";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "advanced" ? "advanced" : "simple";
  } catch {
    return "simple";
  }
}

export function setRuntimeUxMode(mode: RuntimeUxMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("bm:runtime-ux-mode"));
}

export function isRuntimeAdvancedMode(): boolean {
  return getRuntimeUxMode() === "advanced";
}
