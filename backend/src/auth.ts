import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { JwtClaims, Role } from "./types";
import { verifyApiKeyRaw } from "./api-keys";
import { checkApiKeyRateLimit } from "./rate-limit";

const JWT_SECRET = process.env.JWT_SECRET || "change-me";

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: Role;
  authType: "jwt" | "apiKey";
  apiKeyId?: string;
  assistantId?: string;
}

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

export function signToken(payload: { userId: string; tenantId: string; role: Role }) {
  return jwt.sign(
    { sub: payload.userId, tenantId: payload.tenantId, role: payload.role },
    JWT_SECRET,
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
    return;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    reply.code(401).send({
      error: {
        code: "AUTH_001",
        message: "Missing Bearer token",
        trace_id: request.id,
      },
    });
    return;
  }

  const token = authHeader.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtClaims;
    request.auth = {
      userId: decoded.sub,
      tenantId: decoded.tenantId,
      role: decoded.role,
      authType: "jwt",
    };
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
