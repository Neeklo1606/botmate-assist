import type { Prisma } from "@botmate/database";
import type { PrismaClient } from "@botmate/database";
import {
  ExecutionLineageAttachmentSchema,
  type ExecutionLineageAttachment,
  type PolicyJobContext,
} from "@botmate/shared";
import { AssistantRunPayloadSchema, JOB_NAMES } from "@botmate/jobs";
import { AssistantRuntime } from "./assistant-runtime.js";
import {
  parseFallbackChainEnv,
  streamWithProviderFallback,
  type ProviderCredentialBundle,
  type ProviderId,
} from "./model-router.js";
import { normalizeExecutionLineageAttachment } from "./control-plane/execution-lineage-helpers.js";
import { bumpProviderAttempt, bumpStreamChunk } from "./runtime-metrics.js";
import { bumpAssistantRunJobCompleted } from "./enterprise/enterprise-ops-metrics.js";
import { enforceQueueWorkerIngress } from "./policy/index.js";
import { buildRuntimeRagPack } from "./rag/runtime-rag.js";
import { parseAssistantRuntimeSettings } from "./settings-parse.js";
import { createSpan, createTraceId, type RuntimeLogger } from "./tracing.js";
import { estimateUsdCost, persistAiUsageLedger } from "./usage-ledger.js";
import { executionLifecyclePayload, publishTenantInboxEnvelope } from "./realtime/tenant-inbox-publish.js";

const MAX_ACCUMULATED_CHARS = 256_000;

export interface NotificationEnqueuePayload {
  tenantId: string;
  notificationId: string;
  channels: Array<"ws" | "email" | "push">;
  /** Phase 8F — chained propagation from **`assistant.run`** `policyContext`. */
  inheritPolicyContext?: PolicyJobContext | null;
  /** Phase 8G — chained **`executionLineage`** for **`notifications.dispatch`**. */
  inheritExecutionLineage?: ExecutionLineageAttachment | null;
}

export interface ExecuteAssistantRunJobInput {
  prisma: PrismaClient;
  logger: RuntimeLogger;
  job: { id?: string; data: unknown; timestamp?: number };
  enqueueNotification?: (payload: NotificationEnqueuePayload) => Promise<void>;
  /** Phase 9F — Redis publisher (`bm:rt:v1:*`) for tenant inbox lifecycle envelopes. */
  publishRedis?: (channel: string, wireJson: string) => Promise<void>;
}

function uniqueProviders(chain: ProviderId[]): ProviderId[] {
  const out: ProviderId[] = [];
  const seen = new Set<string>();
  for (const id of chain) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export async function executeAssistantRunJob(input: ExecuteAssistantRunJobInput): Promise<void> {
  const payload = AssistantRunPayloadSchema.parse(input.job.data);
  const traceId = createTraceId(payload.correlationId);
  enforceQueueWorkerIngress({
    jobName: JOB_NAMES.ASSISTANT_RUN,
    tenantId: payload.tenantId,
    policyContext: payload.policyContext,
    executionId: traceId,
    logger: input.logger,
    dequeuePayloadRecord: { ...payload },
  });
  const span = createSpan(input.logger, traceId, "assistant_run_job");
  const rt = new AssistantRuntime(input.prisma, input.logger);

  const timeoutMs = Number(process.env.ASSISTANT_RUN_TIMEOUT_MS ?? "90000");

  let queueWaitMs: number | null = null;
  if (payload.queuedAtIso) {
    const ts = Date.parse(payload.queuedAtIso);
    if (!Number.isNaN(ts)) queueWaitMs = Math.max(0, Date.now() - ts);
  } else if (typeof input.job.timestamp === "number") {
    queueWaitMs = Math.max(0, Date.now() - input.job.timestamp);
  }

  rt.logLifecycle(traceId, "boot", {
    tenantId: payload.tenantId,
    assistantId: payload.assistantId,
    sessionId: payload.sessionId,
    jobId: input.job.id ?? null,
    queueWaitMs,
  });

  const assistantRow = await rt.loadAssistantRow(payload.tenantId, payload.assistantId);
  const sessionRow = await rt.loadActiveSessionRow(payload.tenantId, payload.sessionId);

  if (sessionRow.assistantId && sessionRow.assistantId !== assistantRow.id) {
    throw new Error("SESSION_ASSISTANT_MISMATCH");
  }

  const correlationId = payload.correlationId?.trim() || traceId;
  const lineageEarly = normalizeExecutionLineageAttachment(payload.executionLineage);
  const replayTier = lineageEarly?.replayOriginExecutionId ? "replay_lineage" : "live";

  async function emitLifecycle(
    event: "execution.started" | "execution.running" | "execution.completed" | "execution.failed",
    extra?: Record<string, unknown>,
  ): Promise<void> {
    if (!input.publishRedis) return;
    await publishTenantInboxEnvelope({
      publishRedis: input.publishRedis,
      tenantId: payload.tenantId,
      event,
      governanceSurfaceId: "surface.worker.assistant.lifecycle_inbox",
      payload: executionLifecyclePayload({
        traceId,
        executionId: traceId,
        correlationId,
        replayTier,
        runtimeSurface: "assistant.worker",
        policyDecision: "UNKNOWN",
        extra,
      }),
    });
  }

  await emitLifecycle("execution.started");
  await emitLifecycle("execution.running");

  const settings = parseAssistantRuntimeSettings(assistantRow.settings);
  rt.logLifecycle(traceId, "tool_boundary", {
    enabledToolCount: settings.enabledTools.length,
  });

  const openAiApiKey = await rt.decryptOpenAiForOwner(assistantRow.ownerUserId);
  const creds: ProviderCredentialBundle = {
    openAiApiKey,
    openRouterApiKey: process.env.OPENROUTER_API_KEY?.trim() || null,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL?.trim() || null,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY?.trim() || null,
    geminiApiKey: process.env.GEMINI_API_KEY?.trim() || null,
  };

  let lastUserFallback = "";
  let ragQuery = payload.prompt?.trim() ?? "";
  if (!payload.prompt?.trim()) {
    const lastUser = await input.prisma.message.findFirst({
      where: { tenantId: payload.tenantId, sessionId: payload.sessionId, role: "USER" },
      orderBy: { createdAt: "desc" },
      select: { content: true },
    });
    lastUserFallback = lastUser?.content?.trim() ?? "";
    ragQuery = lastUserFallback;
  }

  const ragPack = await buildRuntimeRagPack({
    prisma: input.prisma,
    logger: input.logger,
    traceId,
    tenantId: payload.tenantId,
    assistantId: assistantRow.id,
    settings,
    ragQuery,
    credentialBundle: creds,
  });

  rt.logLifecycle(traceId, "rag_boundary", {
    configuredKbIds: settings.knowledgeBaseIds.length,
    effectiveKbIds: ragPack.metrics.knowledgeBaseIds.length,
    ragDisabled: settings.ragDisabled,
    ragTopK: settings.ragTopK,
    chunksInPrompt: ragPack.metrics.chunksInPrompt,
    skippedReason: ragPack.metrics.skippedReason ?? null,
  });

  rt.logLifecycle(traceId, "tool_capabilities", rt.describeToolSurface(settings));

  const fallback = parseFallbackChainEnv();
  const chain = uniqueProviders([settings.providerHint, ...fallback]);

  const userContent =
    payload.prompt?.trim() ||
    lastUserFallback ||
    "[assistant.run] queued execution — attach prompt via job payload for richer output.";

  const mergedSystem = [settings.systemPrompt.trim(), ragPack.systemAugmentation.trim()]
    .filter(Boolean)
    .join("\n\n---\n\n");

  const messages = [
    ...(mergedSystem.trim() ? [{ role: "system" as const, content: mergedSystem }] : []),
    {
      role: "user" as const,
      content: settings.userTemplate ? `${settings.userTemplate}\n\n${userContent}` : userContent,
    },
  ];

  const promptApproxTokens = Math.ceil(messages.map((m) => m.content).join("\n").length / 4);

  let accumulated = "";
  let chunkCount = 0;
  let lastProvider = "";
  let completionTokensApprox = 0;
  let fatalError: string | null = null;

  const streamStarted = Date.now();

  try {
    for await (const ev of streamWithProviderFallback({
      chain,
      creds,
      chat: {
        model: settings.modelId,
        messages,
        maxTokens: Number(process.env.ASSISTANT_RUN_MAX_TOKENS ?? "900"),
        timeoutMs,
        temperature: settings.temperature,
      },
    })) {
      if (ev.type === "provider_attempt") {
        bumpProviderAttempt();
        lastProvider = ev.provider;
      }
      if (ev.type === "token") {
        bumpStreamChunk();
        chunkCount += 1;
        accumulated += ev.delta;
        if (accumulated.length > MAX_ACCUMULATED_CHARS) {
          fatalError = "OUTPUT_LIMIT";
          break;
        }
      }
      if (ev.type === "usage") {
        if (typeof ev.totalTokens === "number") completionTokensApprox = ev.totalTokens;
      }
      if (ev.type === "error") {
        fatalError = `${ev.code}:${ev.message}`;
        break;
      }
    }

    if (!accumulated.trim() && !fatalError) {
      fatalError = "EMPTY_COMPLETION";
    }

    const durationMs = Date.now() - streamStarted;

    if (fatalError) {
      await input.prisma.message.create({
        data: {
          tenantId: payload.tenantId,
          sessionId: payload.sessionId,
          role: "ASSISTANT",
          content: accumulated || "(no output)",
          deliveryStatus: "partial",
          metadata: {
            runtime: {
              phase: "assistant_run_partial",
              traceId,
              jobId: input.job.id ?? null,
              error: fatalError,
              provider: lastProvider,
              rag:
                ragQuery.trim().length > 0 ?
                  {
                    skippedReason: ragPack.metrics.skippedReason ?? null,
                    knowledgeBaseIds: ragPack.metrics.knowledgeBaseIds,
                    citations:
                      ragPack.citations.length > 0 ?
                        ragPack.citations.map((c) => ({
                          rank: c.rank,
                          chunkId: c.chunkId,
                          documentId: c.documentId,
                          score: c.score,
                        }))
                      : [],
                  }
                : undefined,
            },
          } satisfies Record<string, unknown> as Prisma.InputJsonValue,
        },
      });
    } else {
      await input.prisma.message.create({
        data: {
          tenantId: payload.tenantId,
          sessionId: payload.sessionId,
          role: "ASSISTANT",
          content: accumulated.trim(),
          deliveryStatus: "complete",
          metadata: {
            runtime: {
              phase: "assistant_run_complete",
              traceId,
              jobId: input.job.id ?? null,
              provider: lastProvider,
              streamChunks: chunkCount,
              rag:
                ragQuery.trim().length > 0 ?
                  {
                    skippedReason: ragPack.metrics.skippedReason ?? null,
                    knowledgeBaseIds: ragPack.metrics.knowledgeBaseIds,
                    citations:
                      ragPack.citations.length > 0 ?
                        ragPack.citations.map((c) => ({
                          rank: c.rank,
                          chunkId: c.chunkId,
                          documentId: c.documentId,
                          score: c.score,
                        }))
                      : [],
                  }
                : undefined,
            },
          } satisfies Record<string, unknown> as Prisma.InputJsonValue,
        },
      });
    }

    const completionApprox =
      completionTokensApprox || Math.ceil(accumulated.length / 4);

    const { usageRowId } = await persistAiUsageLedger(input.prisma, {
      tenantId: payload.tenantId,
      assistantId: assistantRow.id,
      sessionId: payload.sessionId,
      traceId,
      jobId: input.job.id ?? null,
      sink: "worker_assistant_run",
      provider: lastProvider || chain[0] || "unknown",
      modelId: settings.modelId,
      promptTokens: promptApproxTokens,
      completionTokens: completionApprox,
      totalTokens: promptApproxTokens + completionApprox,
      durationMs,
      queueWaitMs,
      estimatedCostUsd: estimateUsdCost(settings.modelId, promptApproxTokens, completionApprox),
      streamChunkCount: chunkCount,
      metadata: {
        fatalError,
        chain,
        ...(ragQuery.trim().length > 0 ?
          {
            rag: {
              skippedReason: ragPack.metrics.skippedReason ?? null,
              knowledgeBaseIds: ragPack.metrics.knowledgeBaseIds,
              retrievalMs: ragPack.metrics.retrievalMs,
              embedMs: ragPack.metrics.embedMs,
              hitsConsidered: ragPack.metrics.hitsConsidered,
              chunksInPrompt: ragPack.metrics.chunksInPrompt,
              citations: ragPack.citations.slice(0, 32).map((c) => ({
                rank: c.rank,
                chunkId: c.chunkId,
                documentId: c.documentId,
                score: c.score,
              })),
            },
          }
        : {}),
      } satisfies Record<string, unknown> as Prisma.InputJsonValue,
    });

    await emitLifecycle(fatalError ? "execution.failed" : "execution.completed", {
      usageRowId,
      assistantId: payload.assistantId,
      sessionId: payload.sessionId,
      jobId: input.job.id ?? null,
      fatalError: fatalError ?? undefined,
    });

    if (input.enqueueNotification) {
      const note = await input.prisma.notification.create({
        data: {
          tenantId: payload.tenantId,
          userId: assistantRow.ownerUserId,
          kind: "job",
          title: fatalError ? "Assistant run completed with errors" : "Assistant run completed",
          body: {
            traceId,
            sessionId: payload.sessionId,
            assistantId: payload.assistantId,
            jobId: input.job.id ?? null,
            ok: !fatalError,
          } satisfies Record<string, unknown> as Prisma.InputJsonValue,
          correlationId: traceId,
          traceId,
          executionId: traceId,
          deliveryState: "queued",
        },
      });
      const lineageSeed = normalizeExecutionLineageAttachment(payload.executionLineage);
      const inheritExecutionLineage = ExecutionLineageAttachmentSchema.parse({
        correlationId: payload.correlationId?.trim() || traceId,
        traceId,
        executionId: traceId,
        ...lineageSeed,
      });
      await input.enqueueNotification({
        tenantId: payload.tenantId,
        notificationId: note.id,
        channels: ["ws"],
        inheritPolicyContext: payload.policyContext ?? null,
        inheritExecutionLineage,
      });
    }

    bumpAssistantRunJobCompleted(!fatalError);
    span.end({ ok: !fatalError, provider: lastProvider, chunks: chunkCount });
  } catch (err) {
    bumpAssistantRunJobCompleted(false);
    if (input.publishRedis) {
      try {
        await publishTenantInboxEnvelope({
          publishRedis: input.publishRedis,
          tenantId: payload.tenantId,
          event: "execution.failed",
          governanceSurfaceId: "surface.worker.assistant.lifecycle_inbox",
          payload: executionLifecyclePayload({
            traceId,
            executionId: traceId,
            correlationId,
            replayTier,
            runtimeSurface: "assistant.worker",
            policyDecision: "UNKNOWN",
            extra: {
              phase: "assistant_run_throw",
              message: err instanceof Error ? err.message.slice(0, 512) : String(err).slice(0, 512),
            },
          }),
        });
      } catch {
        /* lifecycle publish must not mask primary failure */
      }
    }
    span.end({ ok: false, err: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}
