import type { FastifyInstance } from "fastify";
import websocket from "@fastify/websocket";
import { randomUUID } from "node:crypto";
import { RealtimeClientToServerSchema } from "@botmate/shared";
import { requireWorkspaceAuth } from "../workspace-auth.js";
import type { RealtimeGateway, RealtimeSocketSink } from "./gateway-types.js";
import { bumpWsClosed, bumpWsOpened } from "./realtime-metrics.js";
import { authenticateRealtimeWs } from "./ws-auth.js";
import { prisma } from "@botmate/database";
import {
  filterRoomsForTenant,
  inboxRoom,
  leadsBoardRoom,
  parseBrowserFeedRoom,
  presenceRoom,
  tenantRootRoom,
} from "./rooms.js";
import { bumpBrowserFeedWsSubscribeRejected } from "./realtime-metrics.js";
import { assertBrowserFeedSubscribeAllowed } from "../browser/browser-feed-subscribe-auth.js";

export async function registerRealtimeWs(app: FastifyInstance, gateway: RealtimeGateway): Promise<void> {
  await app.register(websocket);

  app.get(
    "/api/v1/realtime/ws",
    {
      websocket: true,
      preHandler: authenticateRealtimeWs,
      schema: {
        querystring: {
          type: "object",
          properties: {
            ticket: { type: "string" },
          },
        },
      },
    },
    (socket, req) => {
      const auth = req.auth!;
      if (!requireWorkspaceAuth(auth)) {
        socket.close(1008, "FORBIDDEN");
        return;
      }

      const tenantId = auth.tenantId;

      bumpWsOpened();

      const sinkId = randomUUID();
      const sink: RealtimeSocketSink = {
        id: sinkId,
        send: (raw: string) => {
          try {
            socket.send(raw);
          } catch {
            /* ignore */
          }
        },
      };

      const unsubscribers: Array<() => void> = [];

      const defaultRooms = filterRoomsForTenant(tenantId, [
        tenantRootRoom(tenantId),
        inboxRoom(tenantId),
        leadsBoardRoom(tenantId),
        presenceRoom(tenantId),
      ]);

      unsubscribers.push(gateway.subscribe(tenantId, defaultRooms, sink));
      sink.send(JSON.stringify({ op: "ack", subscribedRooms: defaultRooms }));

      socket.on("message", async (raw: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => {
        if (isBinary) {
          sink.send(JSON.stringify({ op: "error", code: "REALTIME_BINARY", message: "text frames only" }));
          return;
        }
        const text = Buffer.isBuffer(raw)
          ? raw.toString("utf8")
          : Array.isArray(raw)
            ? Buffer.concat(raw).toString("utf8")
            : Buffer.from(raw).toString("utf8");
        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          sink.send(JSON.stringify({ op: "error", code: "REALTIME_PARSE", message: "invalid json" }));
          return;
        }
        const parsed = RealtimeClientToServerSchema.safeParse(json);
        if (!parsed.success) {
          sink.send(JSON.stringify({ op: "error", code: "REALTIME_SCHEMA", message: "invalid payload" }));
          return;
        }
        const msg = parsed.data;
        if (msg.op === "subscribe") {
          const filtered = filterRoomsForTenant(tenantId, msg.rooms).slice(0, 32);
          for (const room of filtered) {
            if (parseBrowserFeedRoom(room)) {
              const ok = await assertBrowserFeedSubscribeAllowed({
                prisma,
                tenantId,
                userId: auth.userId,
                role: auth.role,
                room,
                ticketFeedTokens: auth.browserFeedTokens,
              });
              if (!ok) {
                bumpBrowserFeedWsSubscribeRejected();
                sink.send(
                  JSON.stringify({
                    op: "error",
                    code: "REALTIME_BROWSER_FEED_FORBIDDEN",
                    message: "browser feed subscribe denied",
                  }),
                );
                return;
              }
            }
          }
          unsubscribers.push(gateway.subscribe(tenantId, filtered, sink));
          sink.send(JSON.stringify({ op: "ack", subscribedRooms: filtered }));
          return;
        }
        if (msg.op === "unsubscribe") {
          sink.send(
            JSON.stringify({
              op: "error",
              code: "REALTIME_UNSUPPORTED",
              message: "Unsubscribe batches require reconnect in Phase 3A — duplicate sinks auto-merge client-side.",
            }),
          );
          return;
        }
        if (msg.op === "presence") {
          const frame = JSON.stringify({
            op: "presence",
            tenantId,
            fromUserId: auth.userId,
            kind: msg.kind,
            surface: msg.surface,
            sessionId: msg.sessionId,
            ts: new Date().toISOString(),
          });
          void gateway.publish(tenantId, presenceRoom(tenantId), frame);
        }
      });

      socket.on("close", () => {
        bumpWsClosed();
        for (const u of unsubscribers) u();
      });
    },
  );
}
