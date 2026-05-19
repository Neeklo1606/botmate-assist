import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { JwtClaims, Role } from "./types";
import { readRuntimePolicyEpoch } from "@botmate/runtime";
import { verifyApiKeyRaw } from "./api-keys";
import { checkApiKeyRateLimit, checkTenantRateLimit } from "./rate-limit";
import { getApiEnv } from "./env";
import { getSessionIdFromRequest } from "./session/cookies.js";
import { getUserSession } from "./session/service.js";

function jwtSecret(): string {
  return getApiEnv().JWT_SECRET;
}

function tenantLimitPerMin(): number {
  return getApiEnv().TENANT_RATE_LIMIT_PER_MIN;
}

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: Role;
  authType: "session" | "jwt" | "apiKey" | "wsTicket";
  apiKeyId?: string;
  assistantId?: string;
  sessionId?: string;
  /** Phase 5D — signed WS ticket may embed opaque browser-feed tokens for subscribe ACL. */
  browserFeedTokens?: string[];
  /** Phase 8D — policy epoch for realtime subscribe parity (`POLICY_PROPAGATION_IMPLEMENTATION.md`). Optional until wired tenant-wide. */
  tenantPolicyEpoch?: number;
}

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

export function signToken(payload: { userId: string; tenantId: string; role: Role }) {
  return jwt.sign(
    { sub: payload.userId, tenantId: payload.tenantId, role: payload.role },
    jwtSecret(),
    { expiresIn: "12h" },
  );
}

function extractRawApiKey(request: FastifyRequest): string | null {
  const headerValue = request.headers["x-api-key"];
  if (typeof headerValue === "string" && headerValue.trim().startsWith("bm_")) {
    return headerValue.trim();
  }
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token.startsWith("bm_")) {
      return token;
    }
  }
  return null;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const rawApiKey = extractRawApiKey(request);
  if (rawApiKey) {
    const checked = await verifyApiKeyRaw(rawApiKey);
    if (checked.status === "invalid") {
      reply.code(401).send({
        error: {
          code: "APIKEY_001",
          message: "Invalid API key",
          trace_id: request.id,
        },
      });
      return;
    }
    if (checked.status === "revoked") {
      reply.code(401).send({
        error: {
          code: "APIKEY_002",
          message: "API key is revoked",
          trace_id: request.id,
        },
      });
      return;
    }
    request.auth = {
      userId: checked.value!.userId,
      tenantId: checked.value!.tenantId,
      role: "OPERATOR",
      authType: "apiKey",
      apiKeyId: checked.value!.apiKeyId,
      assistantId: checked.value!.assistantId,
      tenantPolicyEpoch: readRuntimePolicyEpoch(),
    };
    const rateCheck = checkApiKeyRateLimit({
      apiKeyId: checked.value!.apiKeyId,
      limitPerMin: checked.value!.rateLimitPerMin,
    });
    if (!rateCheck.allowed) {
      reply.code(429).send({
        error: {
          code: "RATE_001",
          message: "Rate limit exceeded",
          trace_id: request.id,
        },
      });
      return;
    }
    const tenantCheck = checkTenantRateLimit({
      tenantId: checked.value!.tenantId,
      limitPerMin: tenantLimitPerMin(),
    });
    if (!tenantCheck.allowed) {
      reply.code(429).send({
        error: {
          code: "RATE_001",
          message: "Rate limit exceeded",
          trace_id: request.id,
        },
      });
      return;
    }
    return;
  }

  const sessionId = getSessionIdFromRequest(request);
  if (sessionId) {
    const session = await getUserSession(sessionId);
    if (!session) {
      reply.code(401).send({
        error: {
          code: "AUTH_002",
          message: "Session expired or invalid",
          trace_id: request.id,
        },
      });
      return;
    }
    request.auth = {
      userId: session.userId,
      tenantId: session.tenantId,
      role: session.role,
      authType: "session",
      sessionId: session.id,
      tenantPolicyEpoch: readRuntimePolicyEpoch(),
    };
    const tenantCheck = checkTenantRateLimit({
      tenantId: session.tenantId,
      limitPerMin: tenantLimitPerMin(),
    });
    if (!tenantCheck.allowed) {
      reply.code(429).send({
        error: {
          code: "RATE_001",
          message: "Rate limit exceeded",
          trace_id: request.id,
        },
      });
      return;
    }
    return;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    reply.code(401).send({
      error: {
        code: "AUTH_001",
        message: "Missing authentication",
        trace_id: request.id,
      },
    });
    return;
  }

  const token = authHeader.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, jwtSecret()) as JwtClaims;
    request.auth = {
      userId: decoded.sub,
      tenantId: decoded.tenantId,
      role: decoded.role,
      authType: "jwt",
      tenantPolicyEpoch: readRuntimePolicyEpoch(),
    };
    const tenantCheck = checkTenantRateLimit({
      tenantId: decoded.tenantId,
      limitPerMin: tenantLimitPerMin(),
    });
    if (!tenantCheck.allowed) {
      reply.code(429).send({
        error: {
          code: "RATE_001",
          message: "Rate limit exceeded",
          trace_id: request.id,
        },
      });
      return;
    }
  } catch {
    reply.code(401).send({
      error: {
        code: "AUTH_002",
        message: "Invalid or expired token",
        trace_id: request.id,
      },
    });
    return;
  }
}
