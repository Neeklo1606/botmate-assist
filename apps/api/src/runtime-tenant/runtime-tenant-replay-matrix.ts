import type { PrismaClient } from "@botmate/database";
import type { ReplayVisibilityMatrix } from "@botmate/shared";

function metaFatal(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const fatal = (meta as { fatalError?: unknown }).fatalError;
  return typeof fatal === "string" && fatal.trim() ? fatal.trim() : null;
}

export async function getReplayVisibilityMatrix(input: {
  prisma: PrismaClient;
  tenantId: string;
  executionKey: string;
}): Promise<ReplayVisibilityMatrix | null> {
  const usage = await input.prisma.aiExecutionUsage.findFirst({
    where: {
      tenantId: input.tenantId,
      OR: [{ id: input.executionKey }, { traceId: input.executionKey }],
    },
    select: {
      traceId: true,
      metadata: true,
    },
  });

  if (!usage) return null;

  const traceId = usage.traceId;
  const fatal = metaFatal(usage.metadata);
  const replayLikely =
    typeof usage.metadata === "object" &&
    usage.metadata !== null &&
    "replayOriginExecutionId" in usage.metadata &&
    typeof (usage.metadata as { replayOriginExecutionId?: unknown }).replayOriginExecutionId === "string";

  const denialCount = await input.prisma.runtimeGovernanceAuditEvent.count({
    where: {
      tenantId: input.tenantId,
      traceId,
      code: "POLICY_DENIED",
    },
  });

  const driftCount = await input.prisma.runtimeGovernanceAuditEvent.count({
    where: {
      tenantId: input.tenantId,
      traceId,
      code: "GOVERNANCE_LINEAGE_DRIFT",
    },
  });

  const reasons: string[] = [];
  let tier: ReplayVisibilityMatrix["tier"] = "restricted";

  if (fatal) reasons.push("assistant_fatal_metadata");
  if (denialCount > 0) reasons.push("persisted_POLICY_DENIED");
  if (driftCount > 0) reasons.push("GOVERNANCE_LINEAGE_DRIFT");
  if (!replayLikely) reasons.push("replay_marker_absent");

  const dangerousSignals =
    typeof usage.metadata === "object" &&
    usage.metadata !== null &&
    "chain" in usage.metadata &&
    Array.isArray((usage.metadata as { chain?: unknown }).chain) &&
    JSON.stringify((usage.metadata as { chain: unknown }).chain).includes("tool_http");

  if (fatal || denialCount > 0) {
    tier = "forbidden";
  } else if (!replayLikely) {
    tier = "restricted";
  } else if (dangerousSignals) {
    tier = "dangerous";
  } else if (driftCount > 0) {
    tier = "restricted";
  } else {
    tier = "visible";
  }

  return {
    ok: true,
    projection: "tenant_replay_visibility_v1",
    executionId: traceId,
    traceId,
    replayLikely,
    tier,
    reasons,
  };
}
