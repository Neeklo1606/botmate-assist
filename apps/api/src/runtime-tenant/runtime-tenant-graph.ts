import type { PrismaClient } from "@botmate/database";
import type { ExecutionGraphResponse } from "@botmate/shared";

function metaFatal(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const fatal = (meta as { fatalError?: unknown }).fatalError;
  return typeof fatal === "string" && fatal.trim() ? fatal.trim() : null;
}

export async function getExecutionGraph(input: {
  prisma: PrismaClient;
  tenantId: string;
  executionKey: string;
}): Promise<ExecutionGraphResponse | null> {
  const usage = await input.prisma.aiExecutionUsage.findFirst({
    where: {
      tenantId: input.tenantId,
      OR: [{ id: input.executionKey }, { traceId: input.executionKey }],
    },
    select: {
      id: true,
      traceId: true,
      assistantId: true,
      sessionId: true,
      sink: true,
      queueWaitMs: true,
      metadata: true,
    },
  });

  if (!usage) return null;

  const traceId = usage.traceId;
  const assistantNodeId = `n:assistant:${usage.id}`;
  const nodes: ExecutionGraphResponse["nodes"] = [
    {
      id: assistantNodeId,
      kind: "assistant",
      lane: "assistant",
      label: "Assistant execution",
      refId: usage.id,
      summary: String(usage.sink ?? ""),
    },
  ];
  const edges: ExecutionGraphResponse["edges"] = [];

  const tools =
    usage.sessionId ?
      await input.prisma.toolInvocation.findMany({
        where: { tenantId: input.tenantId, sessionId: usage.sessionId },
        select: { id: true, toolName: true, status: true },
        orderBy: { createdAt: "asc" },
        take: 48,
      })
    : [];

  const toolNodeIds = new Map<string, string>();
  for (const t of tools) {
    const nid = `n:tool:${t.id}`;
    toolNodeIds.set(t.id, nid);
    nodes.push({
      id: nid,
      kind: "tools",
      lane: "tools",
      label: t.toolName,
      refId: t.id,
      summary: String(t.status),
    });
    edges.push({
      id: `e:a:t:${t.id}`,
      kind: "invokes",
      fromId: assistantNodeId,
      toId: nid,
      label: "invokes",
    });
  }

  const browserRuns = await input.prisma.browserRun.findMany({
    where: { tenantId: input.tenantId, traceId },
    select: { id: true, browserSessionId: true, toolInvocationId: true },
    orderBy: { createdAt: "asc" },
    take: 32,
  });

  for (const br of browserRuns) {
    const nid = `n:browser:${br.id}`;
    nodes.push({
      id: nid,
      kind: "browser",
      lane: "browser",
      label: "Browser run",
      refId: br.id,
      summary: br.browserSessionId,
    });
    const toolInv = br.toolInvocationId;
    if (toolInv && toolNodeIds.has(toolInv)) {
      edges.push({
        id: `e:t:b:${br.id}`,
        kind: "emits",
        fromId: toolNodeIds.get(toolInv)!,
        toId: nid,
        label: "emits",
      });
    } else {
      edges.push({
        id: `e:a:b:${br.id}`,
        kind: "derived_from",
        fromId: assistantNodeId,
        toId: nid,
        label: "derived_from",
      });
    }
  }

  if (usage.queueWaitMs != null && usage.queueWaitMs > 0) {
    const qid = `n:queue:${usage.id}`;
    nodes.push({
      id: qid,
      kind: "queue",
      lane: "queue",
      label: "Queue wait",
      refId: null,
      summary: `queueWaitMs=${usage.queueWaitMs}`,
    });
    edges.push({
      id: `e:q:a:${usage.id}`,
      kind: "derived_from",
      fromId: qid,
      toId: assistantNodeId,
      label: "derived_from",
    });
  }

  const fatal = metaFatal(usage.metadata);
  if (fatal) {
    const pid = `n:policy:${usage.id}`;
    nodes.push({
      id: pid,
      kind: "policy",
      lane: "policy",
      label: "Policy signal",
      refId: null,
      summary: fatal.slice(0, 160),
    });
    edges.push({
      id: `e:p:a:${usage.id}`,
      kind: "blocked_by",
      fromId: assistantNodeId,
      toId: pid,
      label: "blocked_by",
    });
  }

  const replayLikely =
    typeof usage.metadata === "object" &&
    usage.metadata !== null &&
    "replayOriginExecutionId" in usage.metadata &&
    typeof (usage.metadata as { replayOriginExecutionId?: unknown }).replayOriginExecutionId === "string";

  if (replayLikely) {
    const rid = `n:replay:${usage.id}`;
    nodes.push({
      id: rid,
      kind: "replay",
      lane: "replay",
      label: "Replay correlation",
      refId: null,
      summary: "replayOriginExecutionId",
    });
    edges.push({
      id: `e:r:a:${usage.id}`,
      kind: "replay_of",
      fromId: rid,
      toId: assistantNodeId,
      label: "replay_of",
    });
  }

  const notifCount = await input.prisma.notification.count({
    where: {
      tenantId: input.tenantId,
      OR: [{ correlationId: traceId }, { traceId }],
    },
  });
  if (notifCount > 0) {
    const nid = `n:notifications:${usage.id}`;
    nodes.push({
      id: nid,
      kind: "notifications",
      lane: "notifications",
      label: "Notifications",
      refId: null,
      summary: `${notifCount} correlated rows`,
    });
    edges.push({
      id: `e:a:n:${usage.id}`,
      kind: "emits",
      fromId: assistantNodeId,
      toId: nid,
      label: "emits",
    });
  }

  return {
    ok: true,
    projection: "tenant_execution_graph_v1",
    executionId: traceId,
    traceId,
    nodes,
    edges,
  };
}
