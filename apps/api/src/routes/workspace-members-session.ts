import type { FastifyReply, FastifyRequest } from "fastify";
import { AuthUserSchema } from "@botmate/shared";
import { signToken } from "../auth.js";
import { setSessionCookie } from "../session/cookies.js";
import { createUserSession } from "../session/service.js";

export async function establishSessionFromUser(
  request: FastifyRequest,
  reply: FastifyReply,
  user: { id: string; tenantId: string; email: string; fullName: string; role: string },
) {
  const session = await createUserSession({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role as "OWNER" | "ADMIN" | "OPERATOR" | "VIEWER",
    email: user.email,
    fullName: user.fullName,
  });
  setSessionCookie(reply, session.id, session.expiresAt);
  const token = signToken({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role as "OWNER" | "ADMIN" | "OPERATOR" | "VIEWER",
  });
  return reply.send({
    ok: true,
    user: AuthUserSchema.parse(user),
    token,
  });
}
