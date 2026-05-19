import type { ToolAsyncExecutePayload } from "@botmate/jobs";
import { JOB_NAMES, ToolAsyncExecutePayloadSchema } from "@botmate/jobs";
import type { RuntimeLogger } from "../tracing.js";
import type { ToolExecutionContext } from "../tool-runtime.js";
import { observeToolExecution } from "../runtime-metrics.js";
import { enforceQueueWorkerIngress } from "../policy/index.js";
import { mergeHttpAllowHosts } from "./ssrf.js";
import { executeConfiguredHttpTool } from "./http-tool-executor.js";

/** Long-running HTTP tool boundary — BullMQ worker executes server-validated URLs against hostname allowlists. */
export async function executeToolAsyncJob(input: {
  logger: RuntimeLogger;
  job: { id?: string; data: unknown };
}): Promise<void> {
  const payload = ToolAsyncExecutePayloadSchema.parse(input.job.data) as ToolAsyncExecutePayload;

  enforceQueueWorkerIngress({
    jobName: JOB_NAMES.TOOLS_ASYNC_EXECUTE,
    tenantId: payload.tenantId,
    policyContext: payload.policyContext,
    executionId: payload.traceId,
    logger: input.logger,
    asyncSurfaceTelemetry: true,
    dequeuePayloadRecord: { ...payload },
  });

  const globalCsv = process.env.TOOL_ASYNC_HTTP_ALLOWLIST ?? process.env.TOOL_HTTP_ALLOWLIST ?? "";
  const allowed = mergeHttpAllowHosts(globalCsv, payload.allowedHosts ?? []);

  const ctx: ToolExecutionContext = {
    tenantId: payload.tenantId,
    assistantId: payload.assistantId ?? "__tool_async__",
    sessionId: payload.sessionId ?? "__tool_async__",
    traceId: payload.traceId,
    userId: "__worker__",
    sessionAssistantId: payload.assistantId ?? null,
    operatorAssistantId: null,
  };

  input.logger.info(
    {
      jobId: input.job.id ?? null,
      tenantId: payload.tenantId,
      traceId: payload.traceId,
      method: payload.method,
      url: payload.url,
    },
    "tool_async_execute_begin",
  );

  const started = Date.now();

  try {
    const result = await executeConfiguredHttpTool({
      ctx,
      urlTemplate: payload.url,
      method: payload.method,
      headers: payload.headers,
      args:
        payload.method === "POST" && payload.body && typeof payload.body === "object" ?
          (payload.body as Record<string, unknown>)
        : {},
      allowedHosts: allowed,
      timeoutMs: payload.timeoutMs,
    });

    const latencyMs = Date.now() - started;
    observeToolExecution({
      ok: Boolean(result.ok),
      latencyMs,
      retries: 0,
      toolId: "async:http",
    });

    input.logger.info(
      {
        jobId: input.job.id ?? null,
        tenantId: payload.tenantId,
        traceId: payload.traceId,
        ok: result.ok,
        latencyMs,
      },
      "tool_async_execute_complete",
    );
  } catch (err) {
    const latencyMs = Date.now() - started;
    observeToolExecution({ ok: false, latencyMs, retries: 0, toolId: "async:http" });
    input.logger.error(
      {
        jobId: input.job.id ?? null,
        tenantId: payload.tenantId,
        traceId: payload.traceId,
        err: err instanceof Error ? err.message : String(err),
      },
      "tool_async_execute_failed",
    );
    throw err;
  }
}
