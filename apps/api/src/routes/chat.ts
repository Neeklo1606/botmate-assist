import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import {
  AppendChatMessageBodySchema,
  ChatAppendAutoResponseSchema,
  ChatAppendPersistResponseSchema,
  ChatMessagesListQuerySchema,
  ChatSessionsListQuerySchema,
  CreateChatSessionBodySchema,
  PatchChatSessionBodySchema,
} from "@botmate/shared";
import { authenticate } from "../auth.js";
import { generateWithUserIntegration, streamWithUserIntegration } from "../model-router.js";
import { runTool } from "../tool-runtime.js";
import { evaluateUnifiedRuntimePolicy } from "@botmate/runtime";
import { getActiveOpenAiIntegration } from "../integrations.js";
import { checkTenantRateLimit } from "../rate-limit.js";
import { requireWorkspaceAuth } from "../workspace-auth.js";
import { MAX_CHAT_MESSAGE_LENGTH } from "../chat/constants.js";
import { chatMessageDtoFromRow } from "../chat/chat-mapper.js";
import { findChatSessionActiveForTenant, insertMessageRow } from "../chat/chat-repository.js";
import {
  appendPersistOnlyMessage,
  archiveWorkspaceChatSession,
  createWorkspaceChatSession,
  listWorkspaceMessages,
  listWorkspaceSessions,
  patchWorkspaceChatSession,
} from "../chat/chat-service.js";
import { emitMessageCreated, emitMessageUpdated } from "../realtime/workspace-events.js";

const TENANT_REQUESTS_PER_MIN = Number(process.env.TENANT_REQUESTS_PER_MIN ?? "60");

function forbiddenWorkspace(reply: { code: (n: number) => { send: (b: unknown) => unknown } }, traceId: string) {
  return reply.code(403).send({
    error: {
      code: "FORBIDDEN_001",
      message: "Chat routes require session or JWT authentication",
      trace_id: traceId,
    },
  });
}

export async function registerChatRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/chat/sessions", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return forbiddenWorkspace(reply, request.id);
    }

    const parsed = ChatSessionsListQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const tenantCheck = checkTenantRateLimit({
      tenantId: auth.tenantId,
      limitPerMin: TENANT_REQUESTS_PER_MIN,
      scope: "crud",
    });
    if (!tenantCheck.allowed) {
      return reply.code(429).send({
        error: {
          code: "RATE_001",
          message: "Rate limit exceeded",
          trace_id: request.id,
        },
      });
    }

    const result = await listWorkspaceSessions(auth, parsed.data);
    return reply.code(200).send(result);
  });

  app.post("/api/v1/chat/sessions", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return forbiddenWorkspace(reply, request.id);
    }

    const parsed = CreateChatSessionBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const tenantCheck = checkTenantRateLimit({
      tenantId: auth.tenantId,
      limitPerMin: TENANT_REQUESTS_PER_MIN,
      scope: "crud",
    });
    if (!tenantCheck.allowed) {
      return reply.code(429).send({
        error: {
          code: "RATE_001",
          message: "Rate limit exceeded",
          trace_id: request.id,
        },
      });
    }

    try {
      const created = await createWorkspaceChatSession(auth, parsed.data);
      return reply.code(201).send(created);
    } catch (error) {
      if (error instanceof Error && error.message === "ASSISTANT_NOT_FOUND") {
        return reply.code(404).send({
          error: {
            code: "ASSISTANT_001",
            message: "Assistant not found for tenant",
            trace_id: request.id,
          },
        });
      }
      request.log.error(error);
      return reply.code(500).send({
        error: {
          code: "CHAT_002",
          message: "Failed to create chat session",
          trace_id: request.id,
        },
      });
    }
  });

  app.patch("/api/v1/chat/sessions/:sessionId", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return forbiddenWorkspace(reply, request.id);
    }

    const { sessionId } = request.params as { sessionId: string };
    const parsed = PatchChatSessionBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const tenantCheck = checkTenantRateLimit({
      tenantId: auth.tenantId,
      limitPerMin: TENANT_REQUESTS_PER_MIN,
      scope: "crud",
    });
    if (!tenantCheck.allowed) {
      return reply.code(429).send({
        error: {
          code: "RATE_001",
          message: "Rate limit exceeded",
          trace_id: request.id,
        },
      });
    }

    const updated = await patchWorkspaceChatSession(auth, sessionId, parsed.data);
    if (!updated) {
      return reply.code(404).send({
        error: {
          code: "CHAT_001",
          message: "session not found",
          trace_id: request.id,
        },
      });
    }
    return reply.code(200).send(updated);
  });

  app.delete("/api/v1/chat/sessions/:sessionId", { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return forbiddenWorkspace(reply, request.id);
    }

    const { sessionId } = request.params as { sessionId: string };

    const tenantCheck = checkTenantRateLimit({
      tenantId: auth.tenantId,
      limitPerMin: TENANT_REQUESTS_PER_MIN,
      scope: "crud",
    });
    if (!tenantCheck.allowed) {
      return reply.code(429).send({
        error: {
          code: "RATE_001",
          message: "Rate limit exceeded",
          trace_id: request.id,
        },
      });
    }

    const ok = await archiveWorkspaceChatSession(auth, sessionId);
    if (!ok) {
      return reply.code(404).send({
        error: {
          code: "CHAT_001",
          message: "session not found",
          trace_id: request.id,
        },
      });
    }
    return reply.code(200).send({ ok: true as const });
  });

  app.get(
    "/api/v1/chat/sessions/:sessionId/messages",
    { preHandler: authenticate },
    async (request, reply) => {
      const auth = request.auth!;
      if (!requireWorkspaceAuth(auth)) {
        return forbiddenWorkspace(reply, request.id);
      }

      const { sessionId } = request.params as { sessionId: string };
      const parsed = ChatMessagesListQuerySchema.safeParse(request.query ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_001",
            message: parsed.error.issues.map((i) => i.message).join("; "),
            trace_id: request.id,
          },
        });
      }

      const tenantCheck = checkTenantRateLimit({
        tenantId: auth.tenantId,
        limitPerMin: TENANT_REQUESTS_PER_MIN,
        scope: "crud",
      });
      if (!tenantCheck.allowed) {
        return reply.code(429).send({
          error: {
            code: "RATE_001",
            message: "Rate limit exceeded",
            trace_id: request.id,
          },
        });
      }

      const result = await listWorkspaceMessages(auth, sessionId, parsed.data);
      if (!result) {
        return reply.code(404).send({
          error: {
            code: "CHAT_001",
            message: "session not found",
            trace_id: request.id,
          },
        });
      }
      return reply.code(200).send(result);
    },
  );

  app.post(
    "/api/v1/chat/sessions/:sessionId/messages",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const auth = request.auth!;
        if (!requireWorkspaceAuth(auth)) {
          return forbiddenWorkspace(reply, request.id);
        }

        const { sessionId } = request.params as { sessionId: string };
        const parsed = AppendChatMessageBodySchema.safeParse(request.body ?? {});
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
        if (body.content.trim().length > MAX_CHAT_MESSAGE_LENGTH) {
          return reply.code(400).send({
            error: {
              code: "VALIDATION_008",
              message: `content exceeds max length ${MAX_CHAT_MESSAGE_LENGTH}`,
              trace_id: request.id,
            },
          });
        }

        const tenantCheck = checkTenantRateLimit({
          tenantId: auth.tenantId,
          limitPerMin: TENANT_REQUESTS_PER_MIN,
          scope: "runtime",
        });
        if (!tenantCheck.allowed) {
          return reply.code(429).send({
            error: {
              code: "RATE_001",
              message: "Rate limit exceeded",
              trace_id: request.id,
            },
          });
        }

        const session = await findChatSessionActiveForTenant(sessionId, auth.tenantId);
        if (!session) {
          return reply.code(404).send({
            error: {
              code: "CHAT_001",
              message: "session not found",
              trace_id: request.id,
            },
          });
        }

        if (body.mode === "persist_only") {
          const message = await appendPersistOnlyMessage(auth, sessionId, body);
          if (!message) {
            return reply.code(404).send({
              error: {
                code: "CHAT_001",
                message: "session not found",
                trace_id: request.id,
              },
            });
          }
          const payload = ChatAppendPersistResponseSchema.parse({ ok: true as const, message });
          return reply.code(201).send(payload);
        }

        const assistantGate = evaluateUnifiedRuntimePolicy({
          tenantId: auth.tenantId,
          subsystem: "assistant",
        });
        if (!assistantGate.ok) {
          return reply.code(503).send({
            error: {
              code: assistantGate.code,
              message: assistantGate.message,
              trace_id: request.id,
            },
          });
        }

        const userRow = await insertMessageRow({
          tenantId: auth.tenantId,
          sessionId,
          role: "USER",
          content: body.content.trim(),
          metadata: {
            chat: { bubble: "visitor" },
          } as Prisma.InputJsonValue,
        });

        emitMessageCreated(auth.tenantId, sessionId, userRow.id);

        const sessionAssistantId = session.assistantId ?? undefined;

        const toolResult = await runTool({
          tenantId: auth.tenantId,
          userId: auth.userId,
          assistantId: auth.assistantId,
          sessionAssistantId,
          sessionTenantId: session.tenantId,
          sessionUserId: session.userId ?? undefined,
          sessionId,
          message: body.content.trim(),
          traceId: request.id,
          role: auth.role,
          log: (payload, message) => request.log.info(payload, message),
        });
        if (toolResult.error) {
          const statusCode =
            toolResult.error.code === "TOOL_003" ? 500
            : toolResult.error.code.startsWith("RUNTIME_") ? 503
            : 400;
          return reply.code(statusCode).send({
            error: {
              code: toolResult.error.code,
              message: toolResult.error.message,
              trace_id: request.id,
            },
          });
        }

        const modelInput = toolResult.responseText
          ? `${body.content.trim()}\n\nTool output:\n${toolResult.responseText}`
          : body.content.trim();

        const generated = await generateWithUserIntegration({
          userId: auth.userId,
          message: modelInput,
          toolRequired: toolResult.used,
        });

        if (generated.integrationMissing) {
          const blockedText =
            "Подключите OpenAI API ключ в разделе «Интеграции» (/workspace?tab=integrations), чтобы ассистент мог отвечать.";
          const assistantRow = await insertMessageRow({
            tenantId: auth.tenantId,
            sessionId,
            role: "ASSISTANT",
            content: blockedText,
            metadata: {
              chat: { bubble: "ai", activationBlocked: true },
            } as Prisma.InputJsonValue,
          });
          emitMessageCreated(auth.tenantId, sessionId, assistantRow.id);
          const payload = ChatAppendAutoResponseSchema.parse({
            sessionId,
            model: "none",
            toolUsed: toolResult.used,
            idempotentHit: toolResult.idempotentHit ?? false,
            integrationRequired: true,
            messages: [chatMessageDtoFromRow(userRow), chatMessageDtoFromRow(assistantRow)],
          });
          return reply.code(201).send(payload);
        }

        const assistantRow = await insertMessageRow({
          tenantId: auth.tenantId,
          sessionId,
          role: "ASSISTANT",
          content: generated.text,
          metadata: {
            chat: { bubble: "ai" },
            runtime: {
              model: generated.selected.model,
              provider: generated.selected.provider,
              toolUsed: toolResult.used,
              idempotentHit: toolResult.idempotentHit ?? false,
              phase: "sync_complete",
            },
          } as Prisma.InputJsonValue,
        });

        emitMessageCreated(auth.tenantId, sessionId, assistantRow.id);

        const payload = ChatAppendAutoResponseSchema.parse({
          sessionId,
          model: generated.selected.model,
          toolUsed: toolResult.used,
          idempotentHit: toolResult.idempotentHit ?? false,
          messages: [chatMessageDtoFromRow(userRow), chatMessageDtoFromRow(assistantRow)],
        });

        return reply.code(201).send(payload);
      } catch (error) {
        request.log.error(error);
        const isCostLimit = error instanceof Error && error.message === "COST_001";
        if (isCostLimit) {
          return reply.code(400).send({
            error: {
              code: "COST_001",
              message: "Request token budget exceeded",
              trace_id: request.id,
            },
          });
        }
        const isBreakerOpen = error instanceof Error && error.message === "PROVIDER_003";
        if (isBreakerOpen) {
          return reply.code(503).send({
            error: {
              code: "PROVIDER_003",
              message: "Provider circuit breaker is open",
              trace_id: request.id,
            },
          });
        }
        return reply.code(502).send({
          error: {
            code: "PROVIDER_001",
            message: "Model provider request failed",
            trace_id: request.id,
          },
        });
      }
    },
  );

  app.get("/api/v1/chat/stream", { preHandler: authenticate }, async (request, reply) => {
    try {
      const auth = request.auth!;
      if (!requireWorkspaceAuth(auth)) {
        return forbiddenWorkspace(reply, request.id);
      }

      const query = request.query as { sessionId?: string; message?: string };
      if (!query.sessionId || !query.message?.trim()) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_003",
            message: "sessionId and message are required",
            trace_id: request.id,
          },
        });
      }
      if (query.message.trim().length > MAX_CHAT_MESSAGE_LENGTH) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_008",
            message: `message exceeds max length ${MAX_CHAT_MESSAGE_LENGTH}`,
            trace_id: request.id,
          },
        });
      }

      const tenantCheck = checkTenantRateLimit({
        tenantId: auth.tenantId,
        limitPerMin: TENANT_REQUESTS_PER_MIN,
        scope: "runtime",
      });
      if (!tenantCheck.allowed) {
        return reply.code(429).send({
          error: {
            code: "RATE_001",
            message: "Rate limit exceeded",
            trace_id: request.id,
          },
        });
      }

      const session = await findChatSessionActiveForTenant(query.sessionId!, auth.tenantId);
      if (!session) {
        return reply.code(404).send({
          error: {
            code: "CHAT_001",
            message: "session not found",
            trace_id: request.id,
          },
        });
      }

      const assistantGate = evaluateUnifiedRuntimePolicy({
        tenantId: auth.tenantId,
        subsystem: "assistant",
      });
      if (!assistantGate.ok) {
        return reply.code(503).send({
          error: {
            code: assistantGate.code,
            message: assistantGate.message,
            trace_id: request.id,
          },
        });
      }

      const userRow = await insertMessageRow({
        tenantId: auth.tenantId,
        sessionId: query.sessionId!,
        role: "USER",
        content: query.message.trim(),
        metadata: {
          chat: { bubble: "visitor" },
          runtime: { phase: "sse_user_persisted" },
        } as Prisma.InputJsonValue,
      });

      emitMessageCreated(auth.tenantId, query.sessionId!, userRow.id);

      const sessionAssistantId = session.assistantId ?? undefined;

      if (!(await getActiveOpenAiIntegration(auth.userId))) {
        return reply.code(404).send({
          error: {
            code: "INTEGRATION_001",
            message: "Active OpenAI integration not found for user",
            trace_id: request.id,
          },
        });
      }

      reply.raw.setHeader("Content-Type", "text/event-stream");
      reply.raw.setHeader("Cache-Control", "no-cache");
      reply.raw.setHeader("Connection", "keep-alive");
      reply.raw.flushHeaders?.();

      const toolResult = await runTool({
        tenantId: auth.tenantId,
        userId: auth.userId,
        assistantId: auth.assistantId,
        sessionAssistantId,
        sessionTenantId: session.tenantId,
        sessionUserId: session.userId ?? undefined,
        sessionId: query.sessionId!,
        message: query.message.trim(),
        traceId: request.id,
        role: auth.role,
        emitToolStream: (chunk) => reply.raw.write(chunk),
        log: (payload, message) => request.log.info(payload, message),
      });

      if (toolResult.error) {
        reply.raw.write(
          `event: error\ndata: ${JSON.stringify({
            code: toolResult.error.code,
            message: toolResult.error.message,
            trace_id: request.id,
          })}\n\n`,
        );
        reply.raw.end();
        return reply;
      }

      let assembled = "";
      let lastModel = "";
      try {
        for await (const event of streamWithUserIntegration({
          userId: auth.userId,
          message: toolResult.responseText
            ? `${query.message!.trim()}\n\nTool output:\n${toolResult.responseText}`
            : query.message!.trim(),
          toolRequired: toolResult.used,
        })) {
          assembled += event.chunk;
          lastModel = event.model;
          reply.raw.write(`event: chunk\ndata: ${JSON.stringify(event)}\n\n`);
        }

        const assistantPersisted = await insertMessageRow({
          tenantId: auth.tenantId,
          sessionId: query.sessionId!,
          role: "ASSISTANT",
          content: assembled,
          metadata: {
            chat: { bubble: "ai" },
            runtime: {
              model: lastModel,
              toolUsed: toolResult.used,
              idempotentHit: toolResult.idempotentHit ?? false,
              phase: "sse_complete",
              userMessageId: userRow.id,
            },
          } as Prisma.InputJsonValue,
        });

        emitMessageCreated(auth.tenantId, query.sessionId!, assistantPersisted.id);

        reply.raw.write("event: done\ndata: {}\n\n");
        reply.raw.end();
        return reply;
      } catch (streamErr) {
        request.log.error(streamErr);
        const isCostLimit = streamErr instanceof Error && streamErr.message === "COST_001";
        const isBreakerOpen = streamErr instanceof Error && streamErr.message === "PROVIDER_003";
        const code = isCostLimit ? "COST_001" : isBreakerOpen ? "PROVIDER_003" : "PROVIDER_001";
        const message = isCostLimit
          ? "Request token budget exceeded"
          : isBreakerOpen
            ? "Provider circuit breaker is open"
            : "Model provider stream failed";

        if (assembled.trim()) {
          const partialRow = await insertMessageRow({
            tenantId: auth.tenantId,
            sessionId: query.sessionId!,
            role: "ASSISTANT",
            content: assembled,
            deliveryStatus: "partial",
            metadata: {
              chat: { bubble: "ai" },
              runtime: {
                model: lastModel,
                phase: "sse_partial",
                errorCode: code,
                userMessageId: userRow.id,
              },
            } as Prisma.InputJsonValue,
          });
          emitMessageUpdated(auth.tenantId, query.sessionId!, partialRow.id, {
            deliveryStatus: "partial",
            runtimePhase: "sse_partial",
          });
        }

        reply.raw.write(
          `event: error\ndata: ${JSON.stringify({
            code,
            message,
            trace_id: request.id,
          })}\n\n`,
        );
        reply.raw.end();
        return reply;
      }
    } catch (error) {
      request.log.error(error);
      const isIntegrationMissing = error instanceof Error && error.message === "INTEGRATION_001";
      if (isIntegrationMissing) {
        return reply.code(404).send({
          error: {
            code: "INTEGRATION_001",
            message: "Active OpenAI integration not found for user",
            trace_id: request.id,
          },
        });
      }
      const isCostLimit = error instanceof Error && error.message === "COST_001";
      const isBreakerOpen = error instanceof Error && error.message === "PROVIDER_003";
      if (reply.raw.headersSent) {
        const code = isCostLimit ? "COST_001" : isBreakerOpen ? "PROVIDER_003" : "PROVIDER_001";
        const message = isCostLimit
          ? "Request token budget exceeded"
          : isBreakerOpen
            ? "Provider circuit breaker is open"
            : "Model provider stream failed";
        reply.raw.write(
          `event: error\ndata: ${JSON.stringify({
            code,
            message,
            trace_id: request.id,
          })}\n\n`,
        );
        reply.raw.end();
        return reply;
      }
      if (isCostLimit) {
        return reply.code(400).send({
          error: {
            code: "COST_001",
            message: "Request token budget exceeded",
            trace_id: request.id,
          },
        });
      }
      if (isBreakerOpen) {
        return reply.code(503).send({
          error: {
            code: "PROVIDER_003",
            message: "Provider circuit breaker is open",
            trace_id: request.id,
          },
        });
      }
      return reply.code(502).send({
        error: {
          code: "PROVIDER_001",
          message: "Model provider stream failed",
          trace_id: request.id,
        },
      });
    }
  });
}
