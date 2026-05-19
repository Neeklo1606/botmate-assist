import type { Prisma, PrismaClient } from "@botmate/database";

export interface UsageLedgerInput {
  tenantId: string;
  assistantId?: string | null;
  sessionId?: string | null;
  traceId: string;
  jobId?: string | null;
  provider: string;
  modelId: string;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  durationMs: number;
  queueWaitMs?: number | null;
  estimatedCostUsd?: number | null;
  streamChunkCount?: number | null;
  /** Phase 11F — commercial/ops attribution (`worker_assistant_run`, `worker_browser_run`, …). */
  sink?: string | null;
  metadata?: Prisma.InputJsonValue;
}

const COST_HINT_USD_PER_1M: Record<string, Partial<{ input: number; output: number }>> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
};

export function estimateUsdCost(modelId: string, promptTokens: number, completionTokens: number): number | null {
  const hint = COST_HINT_USD_PER_1M[modelId];
  if (!hint?.input || !hint.output) return null;
  return (promptTokens / 1_000_000) * hint.input + (completionTokens / 1_000_000) * hint.output;
}

export async function persistAiUsageLedger(prisma: PrismaClient, row: UsageLedgerInput): Promise<{ usageRowId: string }> {
  const created = await prisma.aiExecutionUsage.create({
    data: {
      tenantId: row.tenantId,
      assistantId: row.assistantId ?? undefined,
      sessionId: row.sessionId ?? undefined,
      traceId: row.traceId,
      jobId: row.jobId ?? undefined,
      sink: row.sink?.trim() || "usage_ledger_unspecified",
      provider: row.provider,
      modelId: row.modelId,
      promptTokens: row.promptTokens ?? undefined,
      completionTokens: row.completionTokens ?? undefined,
      totalTokens: row.totalTokens ?? undefined,
      durationMs: row.durationMs,
      queueWaitMs: row.queueWaitMs ?? undefined,
      estimatedCostUsd:
        row.estimatedCostUsd !== undefined && row.estimatedCostUsd !== null ?
          row.estimatedCostUsd
        : undefined,
      streamChunkCount: row.streamChunkCount ?? undefined,
      metadata: row.metadata ?? undefined,
    },
    select: { id: true },
  });
  return { usageRowId: created.id };
}
