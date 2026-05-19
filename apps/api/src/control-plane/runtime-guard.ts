import type { FastifyReply } from "fastify";
import type { RuntimeSubsystem } from "@botmate/shared";
import { evaluateUnifiedRuntimePolicy } from "@botmate/runtime";

/** Standardized HTTP denial path for unified runtime governance checks. */
export function enforceUnifiedRuntimeGate(
  reply: FastifyReply,
  traceId: string,
  tenantId: string,
  subsystem: RuntimeSubsystem,
): boolean {
  const gate = evaluateUnifiedRuntimePolicy({ tenantId, subsystem });
  if (gate.ok) return true;
  void reply.code(503).send({
    error: {
      code: gate.code,
      message: gate.message,
      trace_id: traceId,
    },
  });
  return false;
}
