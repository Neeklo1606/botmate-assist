import type { CreateSessionInput, SessionRecord } from "./types.js";
import type { SessionStore } from "./store.js";
import { PrismaSessionStore } from "./prisma-store.js";

let store: SessionStore | null = null;

export function getSessionStore(): SessionStore {
  if (!store) {
    // Future: if (getApiEnv().REDIS_URL) return new RedisSessionStore(...)
    store = new PrismaSessionStore();
  }
  return store;
}

export function setSessionStore(custom: SessionStore): void {
  store = custom;
}

export async function createUserSession(input: CreateSessionInput): Promise<SessionRecord> {
  return getSessionStore().create(input);
}

export async function getUserSession(sessionId: string): Promise<SessionRecord | null> {
  return getSessionStore().get(sessionId);
}

export async function revokeUserSession(sessionId: string): Promise<void> {
  return getSessionStore().revoke(sessionId);
}
