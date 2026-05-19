/**
 * sessionStorage wrapper для текущего юзера и зарегистрированных аккаунтов.
 * SSR-safe (try/catch + window guard).
 *
 * На production: заменить на cookie/HttpOnly + backend session API.
 */
import type { Session, SessionUser } from "./types";

const SESSION_KEY = "botme:auth:session";
const USERS_KEY = "botme:auth:users";

function safe(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  const s = safe();
  if (!s) return;
  try {
    s.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* noop */
  }
}

export function loadSession(): Session | null {
  const s = safe();
  if (!s) return null;
  try {
    const raw = s.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.user || !parsed?.token || !parsed?.expiresAt) return null;
    if (isExpired(parsed)) {
      s.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  const s = safe();
  if (!s) return;
  try {
    s.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

export function isExpired(session: Session): boolean {
  return Date.now() > new Date(session.expiresAt).getTime();
}

/* ---- Users registry ---- */

function readUsers(): Record<string, SessionUser> {
  const s = safe();
  if (!s) return {};
  try {
    const raw = s.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SessionUser>) : {};
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, SessionUser>): void {
  const s = safe();
  if (!s) return;
  try {
    s.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* noop */
  }
}

function normalizeContact(contact: string): string {
  return contact.trim().toLowerCase();
}

export function getUserByContact(contact: string): SessionUser | null {
  const users = readUsers();
  return users[normalizeContact(contact)] ?? null;
}

export function saveUser(user: SessionUser): void {
  const users = readUsers();
  users[normalizeContact(user.contact)] = user;
  writeUsers(users);
}

export function updateUser(userId: string, patch: Partial<SessionUser>): void {
  const users = readUsers();
  for (const key of Object.keys(users)) {
    const u = users[key]!;
    if (u.id === userId) {
      users[key] = { ...u, ...patch };
    }
  }
  writeUsers(users);
}
