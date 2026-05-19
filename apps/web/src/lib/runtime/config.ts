/**
 * Tenant Runtime dashboard — optional kill-switch on the web bundle only.
 * Server-side enforcement remains `BOTMATE_RUNTIME_TENANT_API=false`.
 */
export function runtimeTenantUiEnabled(): boolean {
  const v = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_RUNTIME_TENANT_UI;
  return v !== "false" && v !== "0";
}

/** Phase 9E workspace / operator / compare surfaces (web-only gate; API still enforces tenant auth). */
export function runtimeWorkspaceUiEnabled(): boolean {
  if (!runtimeTenantUiEnabled()) return false;
  const v = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_RUNTIME_WORKSPACE_UI;
  return v !== "false" && v !== "0";
}
