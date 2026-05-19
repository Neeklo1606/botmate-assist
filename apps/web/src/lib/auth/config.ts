/**
 * Auth feature flags. Default: mock auth (Phase 0 compatibility).
 */
export function isRealAuthEnabled(): boolean {
  const raw = (import.meta as ImportMeta & { env?: Record<string, string> }).env
    ?.VITE_USE_REAL_AUTH;
  return raw === "true" || raw === "1";
}

export function isAppAuthGuardEnabled(): boolean {
  return isRealAuthEnabled();
}
