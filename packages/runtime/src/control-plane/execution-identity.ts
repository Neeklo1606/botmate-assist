import { randomUUID } from "node:crypto";
import { ExecutionIdentitySchema, type ExecutionIdentity } from "@botmate/shared";

/** Canonical helper — aligns assistant/tool/browser/job correlation fields without rewriting callers yet. */
export function createExecutionIdentity(seed?: Partial<ExecutionIdentity>): ExecutionIdentity {
  const correlationId = seed?.correlationId?.trim() || randomUUID();
  const traceId = seed?.traceId?.trim() || correlationId;
  const executionId = seed?.executionId?.trim() || randomUUID();
  const spanId = seed?.spanId?.trim() || randomUUID();
  const rootSpanId = seed?.rootSpanId?.trim() || traceId;

  return ExecutionIdentitySchema.parse({
    correlationId,
    traceId,
    executionId,
    parentExecutionId: seed?.parentExecutionId?.trim(),
    spanId,
    rootSpanId,
  });
}
