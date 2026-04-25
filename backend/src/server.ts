import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { authenticate, signToken } from "./auth";
import { generateWithUserIntegration, streamWithUserIntegration } from "./model-router";
import { state } from "./state";
import { runTool } from "./tool-runtime";
import {
  getActiveOpenAiIntegration,
  maskApiKey,
  revokeOpenAiIntegration,
  upsertOpenAiIntegration,
} from "./integrations";
import { createApiKey, listApiKeys, revokeApiKey } from "./api-keys";
import { ensureDefaultSeedUser, loginUser, registerUser } from "./users";

function nowIso() {
  return new Date().toISOString();
}

export function buildServer() {
  const app = Fastify({ logger: true });

  app.register(cors);
  app.register(sensible);
  app.addHook("onReady", async () => {
    await ensureDefaultSeedUser();
  });

  app.get("/", async () => ({
    name: "botmate-api",
    ok: true,
    docs: "/health",
  }));
  app.get("/health", async () => ({ ok: true }));

  app.post("/api/v1/auth/register", async (request, reply) => {
    const body = (request.body ?? {}) as {
      email?: string;
      password?: string;
      fullName?: string;
    };
    if (!body.email || !body.password || !body.fullName?.trim()) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: "email, password and fullName are required",
          trace_id: request.id,
        },
      });
    }
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
    const token = signToken({
      userId: created.user.id,
      tenantId: created.user.tenantId,
      role: created.user.role,
    });
    return reply.code(201).send({
      token,
      user: created.user,
    });
  });

  app.post("/api/v1/auth/login", async (request, reply) => {
    const body = (request.body ?? {}) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: "email and password are required",
          trace_id: request.id,
        },
      });
    }
    const loggedIn = await loginUser({
      email: body.email,
      password: body.password,
    });
    if (loggedIn.status === "invalid") {
      return reply.code(401).send({
        error: {
          code: "AUTH_004",
          message: "Invalid email or password",
          trace_id: request.id,
        },
      });
    }
    const token = signToken({
      userId: loggedIn.user.id,
      tenantId: loggedIn.user.tenantId,
      role: loggedIn.user.role,
    });
    return {
      token,
      user: loggedIn.user,
    };
  });

  app.post(
    "/api/v1/chat/sessions",
    { preHandler: authenticate },
    async (request, reply) => {
      const auth = request.auth!;
      const session = {
        id: `sess_${Date.now()}`,
        tenantId: auth.tenantId,
        userId: auth.userId,
        createdAt: nowIso(),
      };
      state.sessions.push(session);
      return reply.code(201).send(session);
    },
  );

  app.post(
    "/api/v1/integrations/openai",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const auth = request.auth!;
        const body = (request.body ?? {}) as { apiKey?: string };
        if (!body.apiKey?.trim()) {
          return reply.code(400).send({
            error: {
              code: "VALIDATION_004",
              message: "apiKey is required",
              trace_id: request.id,
            },
          });
        }

        const integration = await upsertOpenAiIntegration({
          userId: auth.userId,
          apiKey: body.apiKey.trim(),
        });
        return reply.code(201).send({
          id: integration.id,
          provider: integration.provider,
          isActive: integration.isActive,
          userId: integration.userId,
          apiKeyMasked: maskApiKey(body.apiKey.trim()),
        });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: {
            code: "CONFIG_002",
            message: "Integration encryption is not configured",
            trace_id: request.id,
          },
        });
      }
    },
  );

  app.delete(
    "/api/v1/integrations/openai",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const auth = request.auth!;
        const revoked = await revokeOpenAiIntegration(auth.userId);
        if (!revoked) {
          return reply.code(404).send({
            error: {
              code: "INTEGRATION_001",
              message: "Active OpenAI integration not found for user",
              trace_id: request.id,
            },
          });
        }
        return reply.code(200).send({ revoked: true });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: {
            code: "INTEGRATION_002",
            message: "Failed to revoke integration",
            trace_id: request.id,
          },
        });
      }
    },
  );

  app.post(
    "/api/v1/api-keys",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const auth = request.auth!;
        const body = (request.body ?? {}) as {
          name?: string;
          assistantId?: string;
          allowedDomains?: string[];
          rateLimitPerMin?: number;
        };
        if (!body.name?.trim()) {
          return reply.code(400).send({
            error: {
              code: "VALIDATION_005",
              message: "name is required",
              trace_id: request.id,
            },
          });
        }

        const created = await createApiKey({
          tenantId: auth.tenantId,
          userId: auth.userId,
          name: body.name.trim(),
          assistantId: body.assistantId?.trim() || undefined,
          allowedDomains: Array.isArray(body.allowedDomains)
            ? body.allowedDomains.map((item) => item.trim()).filter(Boolean)
            : [],
          rateLimitPerMin:
            typeof body.rateLimitPerMin === "number" && body.rateLimitPerMin > 0
              ? Math.floor(body.rateLimitPerMin)
              : 60,
        });

        return reply.code(201).send({
          ...created.item,
          apiKey: created.apiKey,
        });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: {
            code: "APIKEY_001",
            message: "Failed to create api key",
            trace_id: request.id,
          },
        });
      }
    },
  );

  app.get("/api/v1/api-keys", { preHandler: authenticate }, async (request, reply) => {
    try {
      const auth = request.auth!;
      const items = await listApiKeys({
        tenantId: auth.tenantId,
        userId: auth.userId,
      });
      return reply.code(200).send({ items });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: {
          code: "APIKEY_002",
          message: "Failed to list api keys",
          trace_id: request.id,
        },
      });
    }
  });

  app.delete(
    "/api/v1/api-keys/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const auth = request.auth!;
        const params = request.params as { id?: string };
        if (!params.id) {
          return reply.code(400).send({
            error: {
              code: "VALIDATION_006",
              message: "id is required",
              trace_id: request.id,
            },
          });
        }

        const revoked = await revokeApiKey({
          id: params.id,
          tenantId: auth.tenantId,
          userId: auth.userId,
        });
        if (!revoked) {
          return reply.code(404).send({
            error: {
              code: "APIKEY_003",
              message: "api key not found",
              trace_id: request.id,
            },
          });
        }
        return reply.code(200).send({ revoked: true });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
          error: {
            code: "APIKEY_004",
            message: "Failed to revoke api key",
            trace_id: request.id,
          },
        });
      }
    },
  );

  app.post(
    "/api/v1/chat/sessions/:sessionId/messages",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
      const auth = request.auth!;
      const { sessionId } = request.params as { sessionId: string };
      const body = (request.body ?? {}) as { content?: string };
      if (!body.content?.trim()) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_002",
            message: "content is required",
            trace_id: request.id,
          },
        });
      }

      const session = state.sessions.find(
        (item) => item.id === sessionId && item.tenantId === auth.tenantId,
      );
      if (!session) {
        return reply.code(404).send({
          error: {
            code: "CHAT_001",
            message: "session not found",
            trace_id: request.id,
          },
        });
      }

      const userMessage = {
        id: `msg_${Date.now()}`,
        sessionId,
        tenantId: auth.tenantId,
        role: "USER" as const,
        content: body.content.trim(),
        createdAt: nowIso(),
      };
      state.messages.push(userMessage);

      const toolResult = await runTool({
        tenantId: auth.tenantId,
        userId: auth.userId,
        assistantId: auth.assistantId,
        sessionTenantId: session.tenantId,
        sessionUserId: session.userId,
        sessionId,
        message: userMessage.content,
        traceId: request.id,
        log: (payload, message) => request.log.info(payload, message),
      });
      if (toolResult.error) {
        const statusCode = toolResult.error.code === "TOOL_003" ? 500 : 400;
        return reply.code(statusCode).send({
          error: {
            code: toolResult.error.code,
            message: toolResult.error.message,
            trace_id: request.id,
          },
        });
      }
      const modelInput = toolResult.responseText
        ? `${userMessage.content}\n\nTool output:\n${toolResult.responseText}`
        : userMessage.content;
      const generated = await generateWithUserIntegration({
        userId: auth.userId,
        message: modelInput,
        toolRequired: toolResult.used,
      });
      if (generated.integrationMissing) {
        return reply.code(404).send({
          error: {
            code: "INTEGRATION_001",
            message: "Active OpenAI integration not found for user",
            trace_id: request.id,
          },
        });
      }
      const assistantText = generated.text;

      const assistantMessage = {
        id: `msg_${Date.now()}_a`,
        sessionId,
        tenantId: auth.tenantId,
        role: "ASSISTANT" as const,
        content: assistantText,
        createdAt: nowIso(),
      };
      state.messages.push(assistantMessage);

      return reply.code(201).send({
        sessionId,
        model: generated.selected,
        toolUsed: toolResult.used,
        messages: [userMessage, assistantMessage],
      });
      } catch (error) {
        request.log.error(error);
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

  app.get(
    "/api/v1/chat/stream",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
      const auth = request.auth!;
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

      const session = state.sessions.find(
        (item) => item.id === query.sessionId && item.tenantId === auth.tenantId,
      );
      if (!session) {
        return reply.code(404).send({
          error: {
            code: "CHAT_001",
            message: "session not found",
            trace_id: request.id,
          },
        });
      }

      // Early integration check before switching reply to SSE mode.
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

      for await (const event of streamWithUserIntegration({
        userId: auth.userId,
        message: query.message.trim(),
        toolRequired: false,
      })) {
        reply.raw.write(`event: chunk\ndata: ${JSON.stringify(event)}\n\n`);
      }
      reply.raw.write("event: done\ndata: {}\n\n");
      reply.raw.end();
      return reply;
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
        return reply.code(502).send({
          error: {
            code: "PROVIDER_001",
            message: "Model provider stream failed",
            trace_id: request.id,
          },
        });
      }
    },
  );

  return app;
}

if (require.main === module) {
  const app = buildServer();
  const port = Number(process.env.PORT ?? "3001");
  app.listen({ port, host: "0.0.0.0" }).catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}
