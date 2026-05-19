import jwt from "jsonwebtoken";
import type { FastifyReply, FastifyRequest } from "fastify";
import { authenticate } from "../auth.js";
import { getApiEnv } from "../env.js";
import { checkTenantRateLimit } from "../rate-limit.js";
import type { JwtClaims, Role } from "../types.js";
import { readRuntimePolicyEpoch } from "@botmate/runtime";

const WS_TICKET_TYP = "botmate_ws_ticket_v1";

export interface WsTicketClaims extends JwtClaims {
  wsTicketTyp: typeof WS_TICKET_TYP;
  browserFeedTokens?: string[];
  /** Monotonic tenant policy generation — Phase 8E WS epoch enforcement (`BOTMATE_RUNTIME_POLICY_EPOCH`). */
  tenantPolicyEpoch?: number;
}

export function signWsTicket(
  payload: {
    userId: string;
    tenantId: string;
    role: Role;
    browserFeedTokens?: readonly string[];
    tenantPolicyEpoch?: number;
  },
  ttlSec = 120,
): string {
  const tokens =
    payload.browserFeedTokens?.length ?
      payload.browserFeedTokens.map((t) => String(t)).filter(Boolean).slice(0, 16)
    : undefined;
  const epoch =
    typeof payload.tenantPolicyEpoch === "number" && Number.isInteger(payload.tenantPolicyEpoch) ?
      payload.tenantPolicyEpoch
    : 0;
  return jwt.sign(
    {
      sub: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role,
      wsTicketTyp: WS_TICKET_TYP,
      tenantPolicyEpoch: epoch,
      ...(tokens?.length ? { browserFeedTokens: tokens } : {}),
    },
    getApiEnv().JWT_SECRET,
    { expiresIn: ttlSec },
  );
}

export function verifyWsTicket(token: string): WsTicketClaims {
  const decoded = jwt.verify(token, getApiEnv().JWT_SECRET) as WsTicketClaims;
  if (decoded.wsTicketTyp !== WS_TICKET_TYP) {
    throw new Error("invalid_ws_ticket_typ");
  }
  return decoded;
}

function assertWsTenantPolicyEpoch(reply: FastifyReply, request: FastifyRequest): boolean {
  const epoch = readRuntimePolicyEpoch();
  const claimed = request.auth?.tenantPolicyEpoch ?? 0;
  if (claimed !== epoch) {
    reply.code(403).send({
      error: {
        code: "POLICY_EPOCH_MISMATCH",
        message: "WebSocket policy epoch mismatch — mint a fresh ticket",
        trace_id: request.id,
      },
    });
    return false;
  }
  return true;
}

/** Prefer `?ticket=` for browsers that cannot attach Authorization headers to native WebSocket upgrades. */
export async function authenticateRealtimeWs(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const rawTicket =
    typeof request.query === "object" && request.query !== null && "ticket" in request.query
      ? String((request.query as { ticket?: unknown }).ticket ?? "").trim()
      : "";
  if (rawTicket) {
    try {
      const claims = verifyWsTicket(rawTicket);
      request.auth = {
        userId: claims.sub,
        tenantId: claims.tenantId,
        role: claims.role,
        authType: "wsTicket",
        tenantPolicyEpoch:
          typeof claims.tenantPolicyEpoch === "number" && Number.isInteger(claims.tenantPolicyEpoch) ?
            claims.tenantPolicyEpoch
          : 0,
        browserFeedTokens:
          Array.isArray(claims.browserFeedTokens) ?
            claims.browserFeedTokens.map((t) => String(t)).filter(Boolean).slice(0, 16)
          : undefined,
      };
      if (!assertWsTenantPolicyEpoch(reply, request)) {
        return;
      }
      const tenantCheck = checkTenantRateLimit({
        tenantId: claims.tenantId,
        limitPerMin: getApiEnv().TENANT_RATE_LIMIT_PER_MIN,
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
    } catch {
      reply.code(401).send({
        error: {
          code: "AUTH_WS_TICKET",
          message: "Invalid WebSocket ticket",
          trace_id: request.id,
        },
      });
      return;
    }
  }
  await authenticate(request, reply);
  if (reply.sent) return;
  if (!assertWsTenantPolicyEpoch(reply, request)) {
    return;
  }
}
