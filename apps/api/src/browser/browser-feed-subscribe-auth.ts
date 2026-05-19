import type { PrismaClient } from "@botmate/database";
import type { Role } from "../types.js";
import { parseBrowserFeedRoom } from "../realtime/rooms.js";

/** Tenant-safe ACL for subscribing to `tenant:{tid}:browser-feed:{opaque}` WS/redis rooms. */
export async function assertBrowserFeedSubscribeAllowed(input: {
  prisma: PrismaClient;
  tenantId: string;
  userId: string;
  role: Role;
  room: string;
  ticketFeedTokens?: string[];
}): Promise<boolean> {
  const parsed = parseBrowserFeedRoom(input.room);
  if (!parsed || parsed.tenantId !== input.tenantId) return false;

  const token = parsed.token;
  if (input.ticketFeedTokens?.includes(token)) return true;

  const session = await input.prisma.browserSession.findFirst({
    where: { tenantId: input.tenantId, operatorFeedRoomToken: token },
    select: {
      operatorLeaseExpiresAt: true,
      takeoverLeaseExpiresAt: true,
      operatorUserId: true,
      takeoverUserId: true,
    },
  });
  if (!session) return false;

  const now = new Date();
  const tkExp = session.takeoverLeaseExpiresAt;
  const takeoverOk =
    Boolean(session.takeoverUserId) && tkExp !== null && tkExp > now;

  const opExp = session.operatorLeaseExpiresAt;
  const operatorOk =
    Boolean(session.operatorUserId) && opExp !== null && opExp > now;

  if (!takeoverOk && !operatorOk) return false;

  if (input.role === "ADMIN" || input.role === "OWNER") return true;
  if (takeoverOk && session.takeoverUserId === input.userId) return true;
  if (operatorOk && session.operatorUserId === input.userId) return true;

  return false;
}
