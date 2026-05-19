export interface ToolExecutionContext {
  tenantId: string;
  assistantId: string;
  sessionId: string;
  traceId: string;
  /** Workspace user invoking the tool (HTTP/chat path). */
  userId?: string;
  /** Chat session assistant linkage — drives CRM attribution. */
  sessionAssistantId?: string | null;
  /** API-key scoped assistant id (may differ from session linkage). */
  operatorAssistantId?: string | null;
}

export interface ToolNormalizedResult {
  ok: boolean;
  data?: unknown;
  error?: { code: string; message: string };
}

export type RegisteredToolHandler = (
  ctx: ToolExecutionContext,
  args: unknown,
) => Promise<ToolNormalizedResult>;

export type ToolRiskTier = "standard" | "elevated" | "dangerous";

export interface RegisteredToolDefinition {
  id: string;
  description?: string;
  /** RBAC / isolation tier — defaults to `standard`. */
  riskTier?: ToolRiskTier;
  execute: RegisteredToolHandler;
}

export class ToolRegistry {
  private readonly tools = new Map<string, RegisteredToolDefinition>();

  register(def: RegisteredToolDefinition): void {
    this.tools.set(def.id, def);
  }

  get(id: string): RegisteredToolDefinition | undefined {
    return this.tools.get(id);
  }

  snapshotIds(): string[] {
    return [...this.tools.keys()];
  }
}

export class ToolPermissionLayer {
  constructor(private readonly enabled: ReadonlySet<string>) {}

  assertAllowed(toolId: string): void {
    if (!this.enabled.has(toolId)) {
      throw new ToolPermissionDeniedError(toolId);
    }
  }

  static fromAssistantSettings(enabledList: string[]): ToolPermissionLayer {
    return new ToolPermissionLayer(new Set(enabledList));
  }
}

export class ToolPermissionDeniedError extends Error {
  constructor(readonly toolId: string) {
    super(`tool_permission_denied:${toolId}`);
    this.name = "ToolPermissionDeniedError";
  }
}

export function normalizeToolResult(raw: unknown): ToolNormalizedResult {
  if (raw && typeof raw === "object" && "ok" in raw) {
    const r = raw as { ok?: unknown; data?: unknown; error?: unknown };
    return {
      ok: Boolean(r.ok),
      data: r.data,
      error:
        r.error && typeof r.error === "object" ?
          {
            code: String((r.error as { code?: unknown }).code ?? "TOOL_ERROR"),
            message: String((r.error as { message?: unknown }).message ?? "error"),
          }
        : undefined,
    };
  }
  return { ok: true, data: raw };
}
