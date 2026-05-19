import type { PrismaClient } from "@botmate/database";
import type { Prisma } from "@botmate/database";

export type RuntimeActivitySeverityWire = "info" | "warn" | "critical";

export async function upsertRuntimeActivityFact(
  prisma: PrismaClient,
  row: {
    tenantId: string;
    dedupeKey: string;
    kind: string;
    severity: RuntimeActivitySeverityWire;
    traceId?: string | null;
    executionId?: string | null;
    correlationId?: string | null;
    summary: string;
    payload?: Record<string, unknown> | null;
    expiresAt?: Date | null;
  },
): Promise<void> {
  await prisma.runtimeActivityFact.upsert({
    where: {
      tenantId_dedupeKey: {
        tenantId: row.tenantId,
        dedupeKey: row.dedupeKey,
      },
    },
    create: {
      tenantId: row.tenantId,
      dedupeKey: row.dedupeKey,
      ts: new Date(),
      kind: row.kind,
      severity: row.severity,
      traceId: row.traceId ?? undefined,
      executionId: row.executionId ?? undefined,
      correlationId: row.correlationId ?? undefined,
      summary: row.summary,
      payload: row.payload !== undefined && row.payload !== null ? (row.payload as Prisma.InputJsonValue) : undefined,
      expiresAt: row.expiresAt ?? undefined,
    },
    update: {
      ts: new Date(),
      kind: row.kind,
      severity: row.severity,
      traceId: row.traceId ?? undefined,
      executionId: row.executionId ?? undefined,
      correlationId: row.correlationId ?? undefined,
      summary: row.summary,
      payload: row.payload !== undefined && row.payload !== null ? (row.payload as Prisma.InputJsonValue) : undefined,
      expiresAt: row.expiresAt ?? undefined,
    },
  });
}
