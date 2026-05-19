import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  AuthUserSchema,
} from "@botmate/shared";
import { loginUser, registerUser, type AuthUserView } from "../users.js";
import { signToken } from "../auth.js";
import {
  clearSessionCookie,
  getSessionIdFromRequest,
  setSessionCookie,
} from "../session/cookies.js";
import {
  createUserSession,
  getUserSession,
  revokeUserSession,
} from "../session/service.js";

function toAuthUserPayload(user: AuthUserView) {
  return AuthUserSchema.parse({
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });
}

async function establishSession(
  request: FastifyRequest,
  reply: FastifyReply,
  user: AuthUserView,
) {
  const session = await createUserSession({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
  });
  setSessionCookie(reply, session.id, session.expiresAt);
  const token = signToken({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  });
  return reply.send({
    user: toAuthUserPayload(user),
    token,
  });
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/v1/auth/register", async (request, reply) => {
    const parsed = RegisterRequestSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }
    const body = parsed.data;
    if (body.password.length < 8) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_007",
          message: "password must contain at least 8 characters",
          trace_id: request.id,
        },
      });
    }

    const created = await registerUser({
      email: body.email,
      password: body.password,
      fullName: body.fullName,
    });
    if (created.status === "exists") {
      return reply.code(409).send({
        error: {
          code: "AUTH_003",
          message: "User already exists",
          trace_id: request.id,
        },
      });
    }

    return establishSession(request, reply.code(201), created.user);
  });

  app.post("/api/v1/auth/login", async (request, reply) => {
    const parsed = LoginRequestSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: "email and password are required",
          trace_id: request.id,
        },
      });
    }

    const loggedIn = await loginUser(parsed.data);
    if (loggedIn.status === "invalid") {
      return reply.code(401).send({
        error: {
          code: "AUTH_004",
          message: "Invalid email or password",
          trace_id: request.id,
        },
      });
    }

    return establishSession(request, reply, loggedIn.user);
  });

  app.post("/api/v1/auth/logout", async (request, reply) => {
    const sessionId = getSessionIdFromRequest(request);
    if (sessionId) {
      await revokeUserSession(sessionId);
    }
    clearSessionCookie(reply);
    return reply.send({ ok: true });
  });

  app.get("/api/v1/auth/me", async (request, reply) => {
    const sessionId = getSessionIdFromRequest(request);
    if (!sessionId) {
      return reply.code(401).send({
        error: {
          code: "AUTH_001",
          message: "Not authenticated",
          trace_id: request.id,
        },
      });
    }

    const session = await getUserSession(sessionId);
    if (!session) {
      clearSessionCookie(reply);
      return reply.code(401).send({
        error: {
          code: "AUTH_002",
          message: "Session expired or invalid",
          trace_id: request.id,
        },
      });
    }

    return reply.send({
      user: AuthUserSchema.parse({
        id: session.userId,
        tenantId: session.tenantId,
        email: session.email,
        fullName: session.fullName,
        role: session.role,
      }),
    });
  });
}
