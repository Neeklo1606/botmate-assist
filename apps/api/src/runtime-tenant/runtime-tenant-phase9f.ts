import type { FastifyInstance, FastifyReply } from "fastify";
import type { Prisma } from "@botmate/database";
import { prisma } from "@botmate/database";
import { enqueue } from "@botmate/jobs";
import {
  ArtifactSignedTokenResponseSchema,
  ExecutionOperationalMarkBodySchema,
  ExecutionOperationalMarkRowSchema,
  RuntimeActivityFactsQuerySchema,
  RuntimeActivityFactsResponseSchema,
  RuntimeBookmarkRowSchema,
  RuntimeBookmarkUpsertBodySchema,
  RuntimeConsistencyPersistAckBodySchema,
  RuntimeConsistencyPersistAckResponseSchema,
  RuntimeExecutionNoteCreateBodySchema,
  RuntimeExecutionNoteCreateResponseSchema,
  RuntimeExecutionNotesResponseSchema,
  RuntimeIncidentAckBodySchema,
  RuntimeIncidentAckRowSchema,
  RuntimeIncidentsQuerySchema,
  RuntimeIncidentsResponseSchema,
  RuntimePaginationQuerySchema,
  RuntimeReconcileEnqueueResponseSchema,
  AssistantRunEnqueueBodySchema,
  AssistantRunEnqueueResponseSchema,
} from "@botmate/shared";
import {
  reconcileEnqueueCooldownRemainingMs,
  recordSuccessfulReconcileEnqueue,
  recordReconcileEnqueueCooldownSuppressed,
  bumpIncidentAckUpsert,
  bumpConsistencyIncidentAckUpsert,
  bumpOperationalMarkMutation,
  validateIncidentMutedUntilWindow,
  runtimeIncidentMuteMaxMs,
  bumpGovernanceIncidentsProjectionBuild,
  AssistantRunEnqueueError,
  enqueueAssistantRunBounded,
  isAssistantRunEnqueueEnabled,
  bumpAssistantRunEnqueueDisabled,
} from "@botmate/runtime";
import { authenticate } from "../auth.js";
import { requireWorkspaceAuth } from "../workspace-auth.js";
import { getOptionalJobQueues } from "../routes/notifications.js";
import { getRuntimeConsistencyDiagnostics } from "./runtime-tenant-consistency.js";
import { issueArtifactSignedDownload, verifyArtifactSignedDownload } from "./runtime-tenant-artifact-sign.js";
import { streamRuntimeArtifactBinary } from "./runtime-tenant-artifact-binary.js";

type IncidentCluster =
  | "consistency"
  | "reconcile"
  | "policy"
  | "browser"
  | "queue"
  | "correlation"
  | "governance_mark"
  | "replay";

function runtimeTenantApiEnabled(): boolean {
  return process.env.BOTMATE_RUNTIME_TENANT_API?.trim() !== "false";
}

function forbidden(reply: FastifyReply, traceId: string) {
  return reply.code(403).send({
    error: {
      code: "FORBIDDEN_001",
      message: "Runtime routes require workspace session authentication",
      trace_id: traceId,
    },
  });
}

function disabled(reply: FastifyReply, traceId: string) {
  return reply.code(403).send({
    error: {
      code: "RUNTIME_API_DISABLED",
      message: "Tenant runtime API disabled via BOTMATE_RUNTIME_TENANT_API=false",
      trace_id: traceId,
    },
  });
}

async function assertExecutionInTenant(tenantId: string, executionId: string): Promise<boolean> {
  const row = await prisma.aiExecutionUsage.findFirst({
    where: { tenantId, traceId: executionId },
    select: { id: true },
  });
  return Boolean(row);
}

function consistencyIncidentCluster(code: string): IncidentCluster {
  if (code.includes("REPLAY")) return "replay";
  if (code.includes("POLICY") || code.includes("GOVERNANCE")) return "policy";
  if (code.includes("BROWSER")) return "browser";
  if (code.includes("QUEUE")) return "queue";
  if (code.includes("CORRELATION") || code.includes("NOTIFICATION")) return "correlation";
  return "consistency";
}

async function buildIncidentsProjection(tenantId: string) {
  const [facts, consistency, marks] = await Promise.all([
    prisma.runtimeActivityFact.findMany({
      where: { tenantId },
      orderBy: { ts: "desc" },
      take: 80,
    }),
    getRuntimeConsistencyDiagnostics({ prisma, tenantId }),
    prisma.executionOperationalMark.findMany({
      where: {
        tenantId,
        OR: [{ frozen: true }, { escalated: true }, { replayBlocked: true }, { governanceQuarantine: true }],
      },
      orderBy: { updatedAt: "desc" },
      take: 48,
    }),
  ]);

  const items: Array<{
    incidentKey: string;
    cluster: IncidentCluster;
    severity: "info" | "warn" | "critical";
    title: string;
    summary: string;
    traceId: string | null;
    executionId: string | null;
    correlationId: string | null;
    sampleIds: string[];
    remediationHints: string[];
  }> = [];

  for (const issue of consistency.issues) {
    items.push({
      incidentKey: `consistency_issue:${issue.code}`,
      cluster: consistencyIncidentCluster(issue.code),
      severity: issue.severity,
      title: issue.code,
      summary: issue.hint.slice(0, 512),
      traceId: null,
      executionId: null,
      correlationId: null,
      sampleIds: issue.sampleIds.slice(0, 12),
      remediationHints: [
        "Review `/runtime/consistency` workspace",
        "POST `/api/v1/runtime/reconcile/enqueue` for bounded hints",
        ...(issue.sampleIds.length > 0 ?
          [`Inspect samples: ${issue.sampleIds.slice(0, 4).join(", ")}`]
        : []),
      ],
    });
  }

  for (const f of facts) {
    if (!f.kind.startsWith("runtime.reconcile.")) continue;
    items.push({
      incidentKey: `activity_fact:${f.dedupeKey}`,
      cluster: "reconcile",
      severity: f.severity === "critical" ? "critical" : f.severity === "warn" ? "warn" : "info",
      title: f.kind,
      summary: f.summary.slice(0, 512),
      traceId: f.traceId,
      executionId: f.executionId,
      correlationId: f.correlationId,
      sampleIds: [],
      remediationHints: ["Inspect durable RuntimeActivityFact rows", "Correlate with consistency workspace"],
    });
  }

  for (const m of marks) {
    items.push({
      incidentKey: `governance_mark:${m.executionId}`,
      cluster: "governance_mark",
      severity: "warn",
      title: "Execution operational mark",
      summary: [
        m.frozen ? "frozen" : null,
        m.escalated ? "escalated" : null,
        m.replayBlocked ? "replay_blocked" : null,
        m.governanceQuarantine ? "quarantine" : null,
      ]
        .filter(Boolean)
        .join(" · "),
      traceId: m.executionId,
      executionId: m.executionId,
      correlationId: null,
      sampleIds: [],
      remediationHints: ["Review execution inspector summary · governance overlays"],
    });
  }

  const dedup = new Map<string, (typeof items)[number]>();
  const rank = (s: (typeof items)[number]["severity"]) => (s === "critical" ? 3 : s === "warn" ? 2 : 1);
  for (const it of items) {
    const prev = dedup.get(it.incidentKey);
    if (!prev || rank(it.severity) > rank(prev.severity)) dedup.set(it.incidentKey, it);
  }

  bumpGovernanceIncidentsProjectionBuild();

  return RuntimeIncidentsResponseSchema.parse({
    ok: true,
    projection: "tenant_runtime_incidents_v1",
    generatedAt: new Date().toISOString(),
    items: [...dedup.values()],
  });
}

/** Phase 9F operational coordination routes (`PHASE9F_REPORT.md`). */
export function registerRuntimeTenantPhase9fRoutes(app: FastifyInstance): void {
  app.get("/api/v1/runtime/activity-facts", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const parsed = RuntimeActivityFactsQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }
    const q = parsed.data;
    const where: Prisma.RuntimeActivityFactWhereInput = {
      tenantId: auth.tenantId,
      ...(q.kindPrefix ? { kind: { startsWith: q.kindPrefix } } : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.runtimeActivityFact.count({ where }),
      prisma.runtimeActivityFact.findMany({
        where,
        orderBy: { ts: "desc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);

    return RuntimeActivityFactsResponseSchema.parse({
      ok: true,
      projection: "tenant_runtime_activity_facts_v1",
      page: q.page,
      pageSize: q.pageSize,
      total,
      items: rows.map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        dedupeKey: r.dedupeKey,
        ts: r.ts.toISOString(),
        kind: r.kind,
        severity: r.severity as "info" | "warn" | "critical",
        traceId: r.traceId,
        executionId: r.executionId,
        correlationId: r.correlationId,
        summary: r.summary,
        payload:
          r.payload && typeof r.payload === "object" && !Array.isArray(r.payload) ?
            (r.payload as Record<string, unknown>)
          : null,
        expiresAt: r.expiresAt?.toISOString() ?? null,
      })),
    });
  });

  app.post("/api/v1/runtime/bookmarks", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const parsed = RuntimeBookmarkUpsertBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }
    const okExec = await assertExecutionInTenant(auth.tenantId, parsed.data.executionId);
    if (!okExec) {
      return reply.code(404).send({
        error: { code: "RUNTIME_EXECUTION_NOT_FOUND", message: "Execution not found", trace_id: request.id },
      });
    }

    const row = await prisma.runtimeBookmark.upsert({
      where: {
        tenantId_userId_executionId: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          executionId: parsed.data.executionId,
        },
      },
      create: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        executionId: parsed.data.executionId,
        note: parsed.data.note?.trim() || undefined,
      },
      update: {
        note: parsed.data.note?.trim() || undefined,
      },
    });

    return RuntimeBookmarkRowSchema.parse({
      ok: true,
      id: row.id,
      executionId: row.executionId,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
    });
  });

  app.delete("/api/v1/runtime/bookmarks/:executionId", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const executionId = (request.params as { executionId: string }).executionId?.trim();
    if (!executionId) {
      return reply.code(400).send({
        error: { code: "VALIDATION_EXECUTION_ID", message: "executionId required", trace_id: request.id },
      });
    }

    await prisma.runtimeBookmark.deleteMany({
      where: { tenantId: auth.tenantId, userId: auth.userId, executionId },
    });
    return reply.code(204).send();
  });

  app.get("/api/v1/runtime/executions/:executionId/notes", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const executionId = (request.params as { executionId: string }).executionId?.trim();
    if (!executionId) {
      return reply.code(400).send({
        error: { code: "VALIDATION_EXECUTION_ID", message: "executionId required", trace_id: request.id },
      });
    }

    const parsed = RuntimePaginationQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }
    const q = parsed.data;

    const okExec = await assertExecutionInTenant(auth.tenantId, executionId);
    if (!okExec) {
      return reply.code(404).send({
        error: { code: "RUNTIME_EXECUTION_NOT_FOUND", message: "Execution not found", trace_id: request.id },
      });
    }

    const where = { tenantId: auth.tenantId, executionId };
    const [total, rows] = await Promise.all([
      prisma.runtimeExecutionNote.count({ where }),
      prisma.runtimeExecutionNote.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);

    return RuntimeExecutionNotesResponseSchema.parse({
      ok: true,
      items: rows.map((r) => ({
        id: r.id,
        executionId: r.executionId,
        body: r.body,
        createdAt: r.createdAt.toISOString(),
        userId: r.userId,
      })),
      page: q.page,
      pageSize: q.pageSize,
      total,
    });
  });

  app.post("/api/v1/runtime/executions/:executionId/notes", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const executionId = (request.params as { executionId: string }).executionId?.trim();
    if (!executionId) {
      return reply.code(400).send({
        error: { code: "VALIDATION_EXECUTION_ID", message: "executionId required", trace_id: request.id },
      });
    }

    const parsed = RuntimeExecutionNoteCreateBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const okExec = await assertExecutionInTenant(auth.tenantId, executionId);
    if (!okExec) {
      return reply.code(404).send({
        error: { code: "RUNTIME_EXECUTION_NOT_FOUND", message: "Execution not found", trace_id: request.id },
      });
    }

    const row = await prisma.runtimeExecutionNote.create({
      data: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        executionId,
        body: parsed.data.body,
      },
    });

    return reply.code(201).send(
      RuntimeExecutionNoteCreateResponseSchema.parse({
        ok: true,
        id: row.id,
        executionId: row.executionId,
        body: row.body,
        createdAt: row.createdAt.toISOString(),
        userId: row.userId,
      }),
    );
  });

  app.get("/api/v1/runtime/incidents", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const fq = RuntimeIncidentsQuerySchema.safeParse(request.query ?? {});
    if (!fq.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: fq.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }
    const q = fq.data;
    const base = await buildIncidentsProjection(auth.tenantId);
    let items = base.items;
    if (q.cluster) items = items.filter((it) => it.cluster === q.cluster);
    if (q.severity) items = items.filter((it) => it.severity === q.severity);
    return RuntimeIncidentsResponseSchema.parse({ ...base, items });
  });

  app.post("/api/v1/runtime/incidents/ack", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const parsed = RuntimeIncidentAckBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const mutedUntil =
      parsed.data.mutedUntil?.trim() ? new Date(parsed.data.mutedUntil.trim()) : undefined;
    if (mutedUntil && Number.isNaN(mutedUntil.getTime())) {
      return reply.code(400).send({
        error: { code: "VALIDATION_MUTED_UNTIL", message: "mutedUntil invalid", trace_id: request.id },
      });
    }

    if (!validateIncidentMutedUntilWindow(new Date(), mutedUntil)) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_MUTED_UNTIL_MAX",
          message: `mutedUntil exceeds RUNTIME_INCIDENT_MUTE_MAX_MS window (${runtimeIncidentMuteMaxMs()} ms)`,
          trace_id: request.id,
        },
      });
    }

    const row = await prisma.runtimeIncidentAck.upsert({
      where: {
        tenantId_userId_incidentKey: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          incidentKey: parsed.data.incidentKey,
        },
      },
      create: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        incidentKey: parsed.data.incidentKey,
        mutedUntil,
        assigneeLabel: parsed.data.assigneeLabel?.trim() || undefined,
      },
      update: {
        acknowledgedAt: new Date(),
        mutedUntil,
        assigneeLabel: parsed.data.assigneeLabel?.trim() || undefined,
      },
    });

    bumpIncidentAckUpsert();

    return RuntimeIncidentAckRowSchema.parse({
      ok: true,
      incidentKey: row.incidentKey,
      acknowledgedAt: row.acknowledgedAt.toISOString(),
      mutedUntil: row.mutedUntil?.toISOString() ?? null,
      assigneeLabel: row.assigneeLabel,
    });
  });

  app.post("/api/v1/runtime/consistency/ack", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const parsed = RuntimeConsistencyPersistAckBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const incidentKey = `consistency_issue:${parsed.data.issueCode}`;
    const row = await prisma.runtimeIncidentAck.upsert({
      where: {
        tenantId_userId_incidentKey: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          incidentKey,
        },
      },
      create: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        incidentKey,
      },
      update: {
        acknowledgedAt: new Date(),
      },
    });

    bumpConsistencyIncidentAckUpsert();

    return RuntimeConsistencyPersistAckResponseSchema.parse({
      ok: true,
      incidentKey,
      acknowledgedAt: row.acknowledgedAt.toISOString(),
    });
  });

  app.post("/api/v1/runtime/executions/:executionId/operational-mark", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const executionId = (request.params as { executionId: string }).executionId?.trim();
    if (!executionId) {
      return reply.code(400).send({
        error: { code: "VALIDATION_EXECUTION_ID", message: "executionId required", trace_id: request.id },
      });
    }

    const parsed = ExecutionOperationalMarkBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: parsed.error.issues.map((i) => i.message).join("; "),
          trace_id: request.id,
        },
      });
    }

    const okExec = await assertExecutionInTenant(auth.tenantId, executionId);
    if (!okExec) {
      return reply.code(404).send({
        error: { code: "RUNTIME_EXECUTION_NOT_FOUND", message: "Execution not found", trace_id: request.id },
      });
    }

    const existing = await prisma.executionOperationalMark.findUnique({
      where: { tenantId_executionId: { tenantId: auth.tenantId, executionId } },
    });

    const row = await prisma.executionOperationalMark.upsert({
      where: { tenantId_executionId: { tenantId: auth.tenantId, executionId } },
      create: {
        tenantId: auth.tenantId,
        executionId,
        frozen: parsed.data.frozen ?? false,
        escalated: parsed.data.escalated ?? false,
        replayBlocked: parsed.data.replayBlocked ?? false,
        governanceQuarantine: parsed.data.governanceQuarantine ?? false,
        updatedByUserId: auth.userId,
        updatedAt: new Date(),
      },
      update: {
        frozen: parsed.data.frozen !== undefined ? parsed.data.frozen : (existing?.frozen ?? false),
        escalated: parsed.data.escalated !== undefined ? parsed.data.escalated : (existing?.escalated ?? false),
        replayBlocked:
          parsed.data.replayBlocked !== undefined ? parsed.data.replayBlocked : (existing?.replayBlocked ?? false),
        governanceQuarantine:
          parsed.data.governanceQuarantine !== undefined ?
            parsed.data.governanceQuarantine
          : (existing?.governanceQuarantine ?? false),
        updatedByUserId: auth.userId,
        updatedAt: new Date(),
      },
    });

    bumpOperationalMarkMutation();

    return ExecutionOperationalMarkRowSchema.parse({
      ok: true,
      tenantId: row.tenantId,
      executionId: row.executionId,
      frozen: row.frozen,
      escalated: row.escalated,
      replayBlocked: row.replayBlocked,
      governanceQuarantine: row.governanceQuarantine,
      updatedAt: row.updatedAt.toISOString(),
      updatedByUserId: row.updatedByUserId,
    });
  });

  app.post("/api/v1/runtime/assistant-run/enqueue", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    if (!isAssistantRunEnqueueEnabled()) {
      bumpAssistantRunEnqueueDisabled();
      return reply.code(503).send({
        error: {
          code: "ASSISTANT_RUN_ENQUEUE_DISABLED",
          message:
            "Assistant run enqueue is disabled — set BOTMATE_ASSISTANT_RUN_ENQUEUE_ENABLED=true (internal rollout only)",
          trace_id: request.id,
        },
      });
    }

    const queues = getOptionalJobQueues();
    if (!queues) {
      return reply.code(503).send({
        error: {
          code: "RUNTIME_REDIS_UNAVAILABLE",
          message: "Worker queues unavailable — configure REDIS_URL on API host.",
          trace_id: request.id,
        },
      });
    }

    let body: ReturnType<typeof AssistantRunEnqueueBodySchema.parse>;
    try {
      body = AssistantRunEnqueueBodySchema.parse(request.body ?? {});
    } catch {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_001",
          message: "Invalid assistant run enqueue body",
          trace_id: request.id,
        },
      });
    }

    if (auth.role !== "OWNER" && auth.role !== "ADMIN") {
      return reply.code(403).send({
        error: {
          code: "ASSISTANT_RUN_FORBIDDEN",
          message: "Assistant run enqueue requires ADMIN or OWNER role",
          trace_id: request.id,
        },
      });
    }

    try {
      const result = await enqueueAssistantRunBounded({
        prisma,
        queue: queues.assistantRun,
        tenantId: auth.tenantId,
        role: auth.role,
        body,
      });
      return AssistantRunEnqueueResponseSchema.parse({
        ok: true,
        enqueued: result.enqueued,
        traceId: result.traceId,
        jobId: result.jobId,
        reason: result.reason,
      });
    } catch (err) {
      if (err instanceof AssistantRunEnqueueError) {
        return reply.code(err.httpStatus).send({
          error: {
            code: err.code,
            message: err.message,
            trace_id: request.id,
          },
        });
      }
      const { PlanLimitError, TenantOperationalError } = await import("@botmate/runtime");
      if (err instanceof PlanLimitError || err instanceof TenantOperationalError) {
        const { sendCommercialError } = await import("../workspace/commercial-errors.js");
        return sendCommercialError(reply, err, request.id);
      }
      throw err;
    }
  });

  app.post("/api/v1/runtime/reconcile/enqueue", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const queues = getOptionalJobQueues();
    if (!queues) {
      return reply.code(503).send({
        error: {
          code: "RUNTIME_REDIS_UNAVAILABLE",
          message: "Worker queues unavailable — configure REDIS_URL on API host.",
          trace_id: request.id,
        },
      });
    }

    const retryAfterMs = reconcileEnqueueCooldownRemainingMs(auth.tenantId);
    if (retryAfterMs > 0) {
      recordReconcileEnqueueCooldownSuppressed();
      return reply.code(429).send({
        error: {
          code: "RECONCILE_ENQUEUE_COOLDOWN",
          message: `Reconcile enqueue rate limited — retry after ${retryAfterMs} ms`,
          retry_after_ms: retryAfterMs,
          trace_id: request.id,
        },
      });
    }

    const job = await enqueue.runtimeReconcile(queues.runtimeReconcile, { tenantId: auth.tenantId });
    recordSuccessfulReconcileEnqueue(auth.tenantId);
    return RuntimeReconcileEnqueueResponseSchema.parse({
      ok: true,
      enqueued: true,
      jobId: job.id !== undefined ? String(job.id) : undefined,
    });
  });

  app.post("/api/v1/runtime/artifacts/:artifactId/preview-token", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const artifactId = (request.params as { artifactId: string }).artifactId?.trim();
    if (!artifactId) {
      return reply.code(400).send({
        error: { code: "VALIDATION_ARTIFACT_ID", message: "artifactId required", trace_id: request.id },
      });
    }

    let issued: { token: string; expiresAtIso: string };
    try {
      issued = issueArtifactSignedDownload({
        tenantId: auth.tenantId,
        userId: auth.userId,
        artifactId,
      });
    } catch {
      return reply.code(503).send({
        error: {
          code: "ARTIFACT_SIGNING_UNAVAILABLE",
          message: "Configure BOTMATE_ARTIFACT_SIGNING_SECRET or ENCRYPTION_MASTER_KEY.",
          trace_id: request.id,
        },
      });
    }

    const downloadPath = `/api/v1/runtime/artifacts/${encodeURIComponent(artifactId)}/binary-signed`;
    return ArtifactSignedTokenResponseSchema.parse({
      ok: true,
      token: issued.token,
      expiresAtIso: issued.expiresAtIso,
      downloadPath,
    });
  });

  app.get("/api/v1/runtime/artifacts/:artifactId/binary-signed", { preHandler: authenticate }, async (request, reply) => {
    if (!runtimeTenantApiEnabled()) return disabled(reply, request.id);
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) return forbidden(reply, request.id);

    const artifactId = (request.params as { artifactId: string }).artifactId?.trim();
    const tokenRaw = (request.query as { token?: string }).token;
    const token = typeof tokenRaw === "string" ? tokenRaw.trim() : "";
    if (!artifactId || !token) {
      return reply.code(400).send({
        error: { code: "VALIDATION_ARTIFACT_TOKEN", message: "artifactId and token required", trace_id: request.id },
      });
    }

    const wire = verifyArtifactSignedDownload(token);
    if (
      !wire ||
      wire.tenantId !== auth.tenantId ||
      wire.userId !== auth.userId ||
      wire.artifactId !== artifactId
    ) {
      return reply.code(403).send({
        error: { code: "ARTIFACT_TOKEN_REJECTED", message: "Signature mismatch or expired token", trace_id: request.id },
      });
    }

    await streamRuntimeArtifactBinary({
      prisma,
      tenantId: auth.tenantId,
      artifactId,
      reply,
      traceId: request.id,
    });
  });
}
