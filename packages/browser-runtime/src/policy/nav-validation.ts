import { assertSafeHttpUrl } from "@botmate/runtime";

/** Navigation URLs — reuse HTTP SSRF posture (`TOOL_SECURITY.md`). */
export function assertSafeNavigationUrl(urlStr: string, allowedHosts: ReadonlySet<string>): URL {
  return assertSafeHttpUrl(urlStr, allowedHosts);
}

export function assertRoomTenantScoped(room: string, tenantId: string): void {
  const prefix = `tenant:${tenantId}:`;
  if (!room.startsWith(prefix)) {
    throw new Error("browser_room_tenant_mismatch");
  }
}
