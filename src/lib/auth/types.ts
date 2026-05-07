/**
 * Auth types — отдельная система для пользователей, прошедших бриф.
 * User-shape совместим с @/types/entities.User, чтобы /app продолжал работать.
 */
import type { User } from "@/types/entities";

export type AuthMethod = "telegram" | "email";

/** Расширение базового User для сессии, созданной через бриф. */
export interface SessionUser extends User {
  contact: string;
  method: AuthMethod;
  createdAt: string;
  visitCount: number;
}

export interface Session {
  user: SessionUser;
  token: string;
  expiresAt: string;
}
