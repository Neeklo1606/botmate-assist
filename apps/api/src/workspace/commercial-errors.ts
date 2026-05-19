import { PlanLimitError, TenantOperationalError } from "@botmate/runtime";

export function sendCommercialError(
  reply: { code: (n: number) => { send: (b: unknown) => unknown } },
  err: unknown,
  traceId: string,
): unknown {
  if (err instanceof PlanLimitError) {
    return reply.code(err.httpStatus).send({
      error: {
        code: err.code,
        message: err.message,
        trace_id: traceId,
        planTier: err.planTier,
        upgradeTier: err.upgradeTier,
        limitKey: err.limitKey,
      },
    });
  }
  if (err instanceof TenantOperationalError) {
    return reply.code(err.httpStatus).send({
      error: {
        code: err.code,
        message: err.message,
        trace_id: traceId,
      },
    });
  }
  throw err;
}
