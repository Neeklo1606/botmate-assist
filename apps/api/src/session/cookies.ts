import type { FastifyReply, FastifyRequest } from "fastify";
import { getApiEnv } from "../env.js";

export const SESSION_COOKIE_NAME = "botme_session";

export function getSessionIdFromRequest(request: FastifyRequest): string | null {
  const raw = request.cookies?.[SESSION_COOKIE_NAME];
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

export function setSessionCookie(reply: FastifyReply, sessionId: string, expiresAt: Date): void {
  const env = getApiEnv();
  const secure = env.NODE_ENV === "production";
  reply.setCookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  const env = getApiEnv();
  reply.clearCookie(SESSION_COOKIE_NAME, {
    path: "/",
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
  });
}
