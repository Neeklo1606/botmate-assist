/** Canonical room ids — always embed `tenant:${tenantId}` prefix for ACL checks. */

export function tenantRootRoom(tenantId: string): string {
  return `tenant:${tenantId}`;
}

export function inboxRoom(tenantId: string): string {
  return `tenant:${tenantId}:inbox`;
}

export function presenceRoom(tenantId: string): string {
  return `tenant:${tenantId}:presence`;
}

export function leadsBoardRoom(tenantId: string): string {
  return `tenant:${tenantId}:leads`;
}

export function chatSessionRoom(tenantId: string, sessionId: string): string {
  return `tenant:${tenantId}:chat:${sessionId}`;
}

/** Phase 5D — opaque browser operator feed fanout (token issued server-side per session lease). */
export function browserFeedRoom(tenantId: string, feedRoomToken: string): string {
  return `tenant:${tenantId}:browser-feed:${feedRoomToken}`;
}

export function parseBrowserFeedRoom(room: string): { tenantId: string; token: string } | null {
  const m = /^tenant:([^:]+):browser-feed:(.+)$/.exec(room);
  if (!m?.[1] || !m[2]) return null;
  const token = m[2];
  if (token.length < 8 || token.length > 256) return null;
  return { tenantId: m[1], token };
}

export function assistantRoom(tenantId: string, assistantId: string): string {
  return `tenant:${tenantId}:assistant:${assistantId}`;
}

/** Keep join attempts tenant-safe — strips foreign rooms. */
export function filterRoomsForTenant(tenantId: string, rooms: string[]): string[] {
  const root = tenantRootRoom(tenantId);
  const prefix = `${root}:`;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of rooms) {
    if (typeof r !== "string" || r.length > 512) continue;
    if (r === root || r.startsWith(prefix)) {
      if (!seen.has(r)) {
        seen.add(r);
        out.push(r);
      }
    }
  }
  return out;
}
