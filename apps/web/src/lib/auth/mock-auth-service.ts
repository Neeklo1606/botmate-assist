/**
 * Mock auth (Phase 0) — in-memory repository + legacy brief session.
 * Used when VITE_USE_REAL_AUTH=false.
 */
import { repository } from "@/lib/mock/repository";
import type { User } from "@/types/entities";
import {
  clearSession,
  getUserByContact,
  loadSession,
  saveSession,
  saveUser,
} from "./store";
import type { Session, SessionUser } from "./types";

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function detectMethod(contact: string): SessionUser["method"] {
  return contact.trim().startsWith("@") ? "telegram" : "email";
}

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return (parts[0]?.slice(0, 2) || "BM").toUpperCase();
}

export async function mockGetCurrentUser(): Promise<User | null> {
  const sessionUser = loadSession()?.user;
  if (sessionUser) return sessionUser;
  return repository.getCurrentUser();
}

export async function mockLoginWithEmail(payload: {
  email: string;
  password: string;
}): Promise<User> {
  void payload.password;
  return repository.loginWithEmail(payload);
}

export async function mockSignupWithEmail(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  void payload.password;
  return repository.signupWithEmail(payload);
}

export async function mockLoginWithTelegram(): Promise<User> {
  return repository.loginWithTelegram();
}

export async function mockLogout(): Promise<void> {
  clearSession();
  await repository.logout();
}

export interface BriefLoginInput {
  name: string;
  contact: string;
}

export interface BriefLoginResult {
  user: User;
  isNew: boolean;
}

export async function mockBriefLogin(input: BriefLoginInput): Promise<BriefLoginResult> {
  const method = detectMethod(input.contact);
  const existing = getUserByContact(input.contact);
  const now = new Date();
  let user: SessionUser;
  let isNew = false;

  if (existing) {
    user = {
      ...existing,
      name: input.name || existing.name,
      visitCount: (existing.visitCount ?? 1) + 1,
    };
  } else {
    isNew = true;
    user = {
      id: uuid(),
      name: input.name || "Без имени",
      username: method === "telegram" ? input.contact : `@${input.contact.split("@")[0]}`,
      email: method === "email" ? input.contact : `${input.contact.replace(/^@/, "")}@telegram`,
      contact: input.contact,
      method,
      avatarInitials: buildInitials(input.name),
      workspaceName: "Личное пространство",
      role: "owner",
      plan: "start",
      createdAt: now.toISOString(),
      visitCount: 1,
    };
  }
  saveUser(user);

  const session: Session = {
    user,
    token: uuid(),
    expiresAt: new Date(now.getTime() + DAYS_30_MS).toISOString(),
  };
  saveSession(session);

  return { user, isNew };
}

export function mockHydrateSessionUser(): SessionUser | null {
  return loadSession()?.user ?? null;
}
