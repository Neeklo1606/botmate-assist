import { createHash, randomBytes } from "node:crypto";

export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function buildInviteAcceptUrl(token: string, baseUrl?: string): string {
  const origin = baseUrl?.replace(/\/$/, "") ?? process.env.BOTMATE_WEB_ORIGIN?.trim() ?? "http://localhost:8080";
  return `${origin}/accept-invite?token=${encodeURIComponent(token)}`;
}
