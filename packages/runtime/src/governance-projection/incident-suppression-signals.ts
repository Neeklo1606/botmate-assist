/**
 * Phase 11E — join incident ack mute → governance SUPPRESSED overlay signal (detail hydration only).
 */
import type { PrismaClient } from "@botmate/database";

export function governanceMarkIncidentKey(executionId: string): string {
  return `governance_mark:${executionId}`;
}

/** True when any tenant user has an active `mutedUntil` on the governance-mark incident. */
export async function executionHasActiveIncidentSuppression(
  prisma: PrismaClient,
  tenantId: string,
  executionId: string,
): Promise<boolean> {
  const now = new Date();
  const row = await prisma.runtimeIncidentAck.findFirst({
    where: {
      tenantId,
      incidentKey: governanceMarkIncidentKey(executionId),
      mutedUntil: { gt: now },
    },
    select: { id: true },
  });
  return Boolean(row);
}
