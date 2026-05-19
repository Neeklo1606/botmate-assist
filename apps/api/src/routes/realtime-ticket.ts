import type { FastifyInstance } from "fastify";
import { authenticate } from "../auth.js";
import { requireWorkspaceAuth } from "../workspace-auth.js";
import { signWsTicket } from "../realtime/ws-auth.js";
import { readRuntimePolicyEpoch } from "@botmate/runtime";

export function registerRealtimeTicketRoutes(app: FastifyInstance): void {
  app.post("/api/v1/realtime/ws-ticket", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "AUTH_FORBIDDEN",
          message: "Workspace ticket requires cookie/JWT session",
          trace_id: request.id,
        },
      });
    }

    const ttlSec = 120;
    const ticket = signWsTicket(
      {
        userId: auth.userId,
        tenantId: auth.tenantId,
        role: auth.role,
        tenantPolicyEpoch: readRuntimePolicyEpoch(),
      },
      ttlSec,
    );

    return reply.send({
      ticket,
      expiresInSec: ttlSec,
      websocketUrl: "/api/v1/realtime/ws",
      hint: "Append ?ticket=<token> when opening native WebSocket from browsers without Authorization headers.",
    });
  });
}
