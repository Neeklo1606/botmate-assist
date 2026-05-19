import { randomUUID } from "node:crypto";

export type RuntimeLogger = {
  info(meta: Record<string, unknown>, msg: string): void;
  warn(meta: Record<string, unknown>, msg: string): void;
  error(meta: Record<string, unknown>, msg: string): void;
};

export function createTraceId(seed?: string): string {
  return seed?.trim() || randomUUID();
}

export function createSpan(logger: RuntimeLogger, traceId: string, name: string) {
  const started = Date.now();
  logger.info({ traceId, span: name, phase: "start" }, "runtime_span");
  return {
    end(extra?: Record<string, unknown>): void {
      logger.info({ traceId, span: name, phase: "end", durationMs: Date.now() - started, ...extra }, "runtime_span");
    },
  };
}
