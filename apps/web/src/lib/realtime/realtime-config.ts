export function realtimeFlagEnabled(): boolean {
  const v = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_REALTIME_ENABLED;
  return v === "true" || v === "1";
}
