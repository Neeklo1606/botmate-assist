import type { CreateSessionInput, SessionRecord } from "./types.js";

/**
 * Session persistence abstraction.
 * Phase 1: Prisma implementation.
 * Phase 2+: RedisSessionStore implementing the same interface.
 */
export interface SessionStore {
  create(input: CreateSessionInput): Promise<SessionRecord>;
  get(sessionId: string): Promise<SessionRecord | null>;
  revoke(sessionId: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
