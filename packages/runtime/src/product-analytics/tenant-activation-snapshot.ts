import type { PrismaClient } from "@botmate/database";
import type { TenantActivationSnapshot } from "@botmate/shared";
import { bumpActivationSnapshotBuilt } from "./product-support-metrics.js";

const MILESTONE_DEDUPE = {
  firstAssistant: "milestone:first_assistant",
  firstKnowledge: "milestone:first_knowledge",
  firstChat: "milestone:first_chat",
  firstExecution: "milestone:first_execution",
  runtimeOpened: "milestone:runtime_opened",
  compareOpened: "milestone:compare_opened",
  incidentsOpened: "milestone:incidents_opened",
  browserRun: "milestone:browser_run",
} as const;

export async function buildTenantActivationSnapshot(
  prisma: PrismaClient,
  tenantId: string,
): Promise<TenantActivationSnapshot> {
  const since7d = new Date(Date.now() - 7 * 86_400_000);

  const [
    assistantsCount,
    activeAssistantsCount,
    knowledgeDocumentsCount,
    chatSessionsCount,
    assistantMessagesCount,
    executionsCount,
    browserRunsCount,
    incidentAcksCount,
    milestoneRows,
    eventCounts,
    distinctUsers7d,
  ] = await Promise.all([
    prisma.assistant.count({ where: { tenantId, archivedAt: null } }),
    prisma.assistant.count({ where: { tenantId, archivedAt: null, status: "active" } }),
    prisma.knowledgeDocument.count({ where: { tenantId } }),
    prisma.chatSession.count({ where: { tenantId, archivedAt: null } }),
    prisma.message.count({
      where: { tenantId, role: "ASSISTANT" },
    }),
    prisma.aiExecutionUsage.count({ where: { tenantId } }),
    prisma.browserRun.count({ where: { tenantId } }),
    prisma.runtimeIncidentAck.count({ where: { tenantId } }),
    prisma.productAnalyticsEvent.findMany({
      where: {
        tenantId,
        dedupeKey: { in: Object.values(MILESTONE_DEDUPE) },
      },
      select: { dedupeKey: true },
    }),
    prisma.productAnalyticsEvent.groupBy({
      by: ["name"],
      where: { tenantId, createdAt: { gte: since7d } },
      _count: { _all: true },
    }),
    prisma.productAnalyticsEvent.findMany({
      where: { tenantId, createdAt: { gte: since7d }, userId: { not: null } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const milestoneSet = new Set(
    milestoneRows.map((r) => r.dedupeKey).filter((k): k is string => Boolean(k)),
  );

  const milestones = {
    firstAssistantCreated:
      milestoneSet.has(MILESTONE_DEDUPE.firstAssistant) || assistantsCount > 0,
    firstKnowledgeUploaded:
      milestoneSet.has(MILESTONE_DEDUPE.firstKnowledge) || knowledgeDocumentsCount > 0,
    firstChatSuccess:
      milestoneSet.has(MILESTONE_DEDUPE.firstChat) || assistantMessagesCount > 0,
    firstExecutionRecorded:
      milestoneSet.has(MILESTONE_DEDUPE.firstExecution) || executionsCount > 0,
    runtimeOpened: milestoneSet.has(MILESTONE_DEDUPE.runtimeOpened),
    compareOpened: milestoneSet.has(MILESTONE_DEDUPE.compareOpened),
    incidentsViewed: milestoneSet.has(MILESTONE_DEDUPE.incidentsOpened),
    browserRunStarted:
      milestoneSet.has(MILESTONE_DEDUPE.browserRun) || browserRunsCount > 0,
  };

  const productEventsLast7d: Record<string, number> = {};
  for (const row of eventCounts) {
    productEventsLast7d[row.name] = row._count._all;
  }

  const health = classifyTenantHealth({
    milestones,
    assistantsCount,
    assistantMessagesCount,
    executionsCount,
    productEventsLast7d,
  });

  const hints = buildActivationHints({ milestones, health, activeAssistantsCount });

  bumpActivationSnapshotBuilt();

  return {
    ok: true,
    tenantId,
    health,
    derived: {
      assistantsCount,
      activeAssistantsCount,
      knowledgeDocumentsCount,
      chatSessionsCount,
      assistantMessagesCount,
      executionsCount,
      browserRunsCount,
      incidentAcksCount,
      returningUsers7d: distinctUsers7d.length,
    },
    milestones,
    productEventsLast7d,
    hints,
  };
}

function classifyTenantHealth(input: {
  milestones: TenantActivationSnapshot["milestones"];
  assistantsCount: number;
  assistantMessagesCount: number;
  executionsCount: number;
  productEventsLast7d: Record<string, number>;
}): TenantActivationSnapshot["health"] {
  const hasRecentActivity =
    Object.values(input.productEventsLast7d).reduce((a, b) => a + b, 0) > 0 ||
    input.assistantMessagesCount > 0;

  if (!input.milestones.firstAssistantCreated && input.assistantsCount === 0) {
    return "stuck";
  }

  if (
    input.milestones.firstAssistantCreated &&
    !input.milestones.firstChatSuccess &&
    input.assistantMessagesCount === 0
  ) {
    return "stuck";
  }

  const runtimeErrors = input.productEventsLast7d["support.runtime_api_error"] ?? 0;
  const wsReconnects = input.productEventsLast7d["support.ws_reconnect"] ?? 0;
  if (runtimeErrors >= 5 || wsReconnects >= 20) {
    return "at_risk";
  }

  if (!hasRecentActivity && input.assistantsCount > 0) {
    return "inactive";
  }

  if (
    input.milestones.firstChatSuccess &&
    (input.milestones.runtimeOpened || input.executionsCount > 0)
  ) {
    return "healthy";
  }

  if (input.milestones.firstChatSuccess) {
    return "activating";
  }

  return "activating";
}

function buildActivationHints(input: {
  milestones: TenantActivationSnapshot["milestones"];
  health: TenantActivationSnapshot["health"];
  activeAssistantsCount: number;
}): string[] {
  const hints: string[] = [];
  if (!input.milestones.firstAssistantCreated) {
    hints.push("Create your first assistant to start answering customers.");
  } else if (!input.milestones.firstKnowledgeUploaded) {
    hints.push("Upload knowledge so assistants can answer with your content.");
  } else if (!input.milestones.firstChatSuccess) {
    hints.push("Send a test message in Chat to validate the assistant.");
  } else if (!input.milestones.runtimeOpened) {
    hints.push("Open Runtime to inspect executions and operator overlays.");
  } else if (input.activeAssistantsCount === 0) {
    hints.push("Publish an assistant (status active) before going live.");
  }
  if (input.health === "at_risk") {
    hints.push("Connection or runtime errors detected — contact support if this persists.");
  }
  return hints;
}

export { MILESTONE_DEDUPE };
