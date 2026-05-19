import type { RuntimeLogger } from "../tracing.js";
import {
  normalizeToolResult,
  ToolPermissionDeniedError,
  ToolRegistry,
  type RegisteredToolDefinition,
  type ToolExecutionContext,
  type ToolNormalizedResult,
  type ToolPermissionLayer,
} from "../tool-runtime.js";
import { observeToolExecution } from "../runtime-metrics.js";
import { assertToolRiskTierAllowed, type WorkspaceRole } from "./dangerous-guard.js";
import { enforceToolExecutionPolicyIngress } from "../policy/surface-enforcement.js";

export class ToolRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolRetryableError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export interface ToolRunMetrics {
  latencyMs: number;
  retries: number;
}

export class ToolExecutionEngine {
  private readonly registry = new ToolRegistry();

  constructor(private readonly logger?: RuntimeLogger) {}

  register(def: RegisteredToolDefinition): void {
    this.registry.register(def);
  }

  snapshotRegisteredIds(): string[] {
    return this.registry.snapshotIds();
  }

  async run(input: {
    toolId: string;
    ctx: ToolExecutionContext;
    args: unknown;
    permission: ToolPermissionLayer;
    risk: {
      userRole?: WorkspaceRole;
      dangerousEnabled: ReadonlySet<string>;
    };
    options?: {
      timeoutMs?: number;
      maxRetries?: number;
      signal?: AbortSignal;
    };
  }): Promise<{ result: ToolNormalizedResult } & ToolRunMetrics> {
    const def = this.registry.get(input.toolId);
    if (!def) {
      throw new ToolPermissionDeniedError(input.toolId);
    }

    input.permission.assertAllowed(input.toolId);
    assertToolRiskTierAllowed({
      toolId: input.toolId,
      tier: def.riskTier,
      userRole: input.risk.userRole,
      dangerousEnabled: input.risk.dangerousEnabled,
    });

    enforceToolExecutionPolicyIngress({
      tenantId: input.ctx.tenantId,
      toolId: input.toolId,
      executionId: input.ctx.traceId,
      actorId: input.ctx.userId ?? undefined,
      logger: this.logger,
    });

    if (input.options?.signal?.aborted) {
      observeToolExecution({ ok: false, latencyMs: 0, retries: 0, toolId: input.toolId });
      return {
        result: { ok: false, error: { code: "TOOL_ABORTED", message: "Aborted before execution" } },
        latencyMs: 0,
        retries: 0,
      };
    }

    const timeoutMs =
      input.options?.timeoutMs ?? Number(process.env.TOOL_DEFAULT_TIMEOUT_MS ?? `${30_000}`);
    const maxRetries = input.options?.maxRetries ?? Number(process.env.TOOL_DEFAULT_MAX_RETRIES ?? `2`);

    const started = Date.now();
    let retries = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const outcome = await Promise.race([
          def.execute(input.ctx, input.args),
          new Promise<ToolNormalizedResult>((_, reject) => {
            setTimeout(() => reject(new ToolRetryableError("TOOL_TIMEOUT")), timeoutMs);
          }),
        ]);

        const latencyMs = Date.now() - started;
        const normalized = normalizeToolResult(outcome);
        observeToolExecution({
          ok: Boolean(normalized.ok),
          latencyMs,
          retries,
          toolId: input.toolId,
        });
        this.logger?.info(
          {
            traceId: input.ctx.traceId,
            toolId: input.toolId,
            ok: normalized.ok,
            latencyMs,
            retries,
          },
          "tool_execution_complete",
        );
        return { result: normalized, latencyMs, retries };
      } catch (err) {
        const retryable =
          err instanceof ToolRetryableError ||
          (err instanceof Error &&
            (err.message === "TOOL_TIMEOUT" ||
              err.message.includes("TOOL_HTTP_RETRYABLE") ||
              err.message.includes("fetch failed")));

        if (attempt < maxRetries && retryable) {
          retries += 1;
          const backoff = Math.min(5000, 200 * 2 ** attempt);
          await sleep(backoff);
          continue;
        }

        const latencyMs = Date.now() - started;
        observeToolExecution({ ok: false, latencyMs, retries, toolId: input.toolId });
        this.logger?.warn(
          {
            traceId: input.ctx.traceId,
            toolId: input.toolId,
            err: err instanceof Error ? err.message : String(err),
            retries,
          },
          "tool_execution_failed",
        );

        return {
          result: {
            ok: false,
            error: {
              code: "TOOL_RUNTIME_FAILED",
              message: err instanceof Error ? err.message.slice(0, 512) : String(err),
            },
          },
          latencyMs,
          retries,
        };
      }
    }

    const latencyMs = Date.now() - started;
    observeToolExecution({ ok: false, latencyMs, retries, toolId: input.toolId });
    return {
      result: { ok: false, error: { code: "TOOL_RUNTIME_FAILED", message: "retry_exhausted" } },
      latencyMs,
      retries,
    };
  }
}
