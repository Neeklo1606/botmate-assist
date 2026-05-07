/**
 * useBriefLogin / useBriefLogout — регистрация и выход для брифа.
 * Пишут в TanStack Query cache по qk.auth.currentUser, чтобы существующий
 * _app.tsx (через AuthSync в __root) сразу видел пользователя.
 *
 * TODO: replace with real API — POST /api/auth/register
 */
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import type { SessionUser, Session, AuthMethod } from "./types";
import {
  clearSession,
  getUserByContact,
  loadSession,
  saveSession,
  saveUser,
} from "./store";

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function detectMethod(contact: string): AuthMethod {
  return contact.trim().startsWith("@") ? "telegram" : "email";
}

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return (parts[0]?.slice(0, 2) || "BM").toUpperCase();
}

export interface BriefLoginInput {
  name: string;
  contact: string;
}

export interface BriefLoginResult {
  user: SessionUser;
  isNew: boolean;
}

export function useBriefLogin(): (input: BriefLoginInput) => Promise<BriefLoginResult> {
  const qc = useQueryClient();
  return useCallback(
    async ({ name, contact }: BriefLoginInput): Promise<BriefLoginResult> => {
      const method = detectMethod(contact);
      const existing = getUserByContact(contact);
      const now = new Date();
      let user: SessionUser;
      let isNew = false;

      if (existing) {
        user = {
          ...existing,
          name: name || existing.name,
          visitCount: (existing.visitCount ?? 1) + 1,
        };
      } else {
        isNew = true;
        user = {
          id: uuid(),
          name: name || "Без имени",
          username: method === "telegram" ? contact : `@${contact.split("@")[0]}`,
          email: method === "email" ? contact : `${contact.replace(/^@/, "")}@telegram`,
          contact,
          method,
          avatarInitials: buildInitials(name),
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
      qc.setQueryData(qk.auth.currentUser, user);

      return { user, isNew };
    },
    [qc],
  );
}

export function useBriefLogout(): () => void {
  const qc = useQueryClient();
  return useCallback(() => {
    clearSession();
    qc.setQueryData(qk.auth.currentUser, null);
    qc.clear();
  }, [qc]);
}

export function hydrateSessionUser(): SessionUser | null {
  const s = loadSession();
  return s?.user ?? null;
}
