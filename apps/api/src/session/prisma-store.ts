import { randomBytes } from "node:crypto";
import { prisma } from "@botmate/database";
import type { Role } from "../types.js";
import type { CreateSessionInput, SessionRecord } from "./types.js";
import type { SessionStore } from "./store.js";

const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;

function newSessionId(): string {
  return randomBytes(32).toString("base64url");
}

export class PrismaSessionStore implements SessionStore {
  async create(input: CreateSessionInput): Promise<SessionRecord> {
    const id = newSessionId();
    const ttlMs = input.ttlMs ?? DEFAULT_TTL_MS;
    const expiresAt = new Date(Date.now() + ttlMs);

    await prisma.authSession.create({
      data: {
        id,
        userId: input.userId,
        tenantId: input.tenantId,
        expiresAt,
      },
    });

    return {
      id,
      userId: input.userId,
      tenantId: input.tenantId,
      role: input.role,
      email: input.email,
      fullName: input.fullName,
      expiresAt,
    };
  }

  async get(sessionId: string): Promise<SessionRecord | null> {
    const row = await prisma.authSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!row || row.revokedAt) {
      return null;
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      await prisma.authSession.delete({ where: { id: sessionId } }).catch(() => undefined);
      return null;
    }
    return {
      id: row.id,
      userId: row.userId,
      tenantId: row.tenantId,
      role: row.user.role as Role,
      email: row.user.email,
      fullName: row.user.fullName,
      expiresAt: row.expiresAt,
    };
  }

  async revoke(sessionId: string): Promise<void> {
    await prisma.authSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
