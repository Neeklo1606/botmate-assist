import type { RuntimeLogger } from "../tracing.js";
import { bumpPolicyContextMissing } from "../policy/policy-metrics.js";
import { bumpMcpPolicyContextRejected } from "../production/production-metrics.js";
import { requireMcpPolicyContext } from "../production/production-strict.js";
import { enforceMcpCallPolicyIngress } from "../policy/surface-enforcement.js";
import type { McpToolDescriptor } from "./mcp-types.js";
import type { McpHttpTransport } from "./mcp-http-transport.js";

/**
 * MCP session lifecycle — initialize → discovery (`tools/list`) → invoke (`tools/call`).
 * Transport errors surface to callers (no autonomous retries beyond worker HTTP defaults).
 */
export class McpSession {
  private initialized = false;

  constructor(
    private readonly transport: McpHttpTransport,
    private readonly logger: RuntimeLogger,
    private readonly traceId: string,
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;
    const id = this.transport.mintId();
    const res = await this.transport.send({
      jsonrpc: "2.0",
      id,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "botmate-runtime", version: "0.0.0" },
      },
    });
    if (res.error) {
      throw new Error(`MCP_INIT_FAILED:${res.error.message}`);
    }
    const nid = this.transport.mintId();
    try {
      await this.transport.send({
        jsonrpc: "2.0",
        id: nid,
        method: "notifications/initialized",
        params: {},
      });
    } catch (err) {
      this.logger.warn(
        {
          traceId: this.traceId,
          err: err instanceof Error ? err.message : String(err),
        },
        "mcp_notifications_initialized_optional_failed",
      );
    }
    this.initialized = true;
    this.logger.info({ traceId: this.traceId, phase: "mcp_initialized" }, "mcp_session_ready");
  }

  async listTools(): Promise<McpToolDescriptor[]> {
    await this.initialize();
    const id = this.transport.mintId();
    const res = await this.transport.send<{ tools?: McpToolDescriptor[] }>({
      jsonrpc: "2.0",
      id,
      method: "tools/list",
      params: {},
    });
    if (res.error) {
      throw new Error(`MCP_TOOLS_LIST_FAILED:${res.error.message}`);
    }
    const tools = res.result?.tools ?? [];
    this.logger.info({ traceId: this.traceId, mcpToolCount: tools.length }, "mcp_tools_list");
    return tools;
  }

  async callTool(
    name: string,
    args: unknown,
    policy?: { tenantId: string; executionId?: string; actorId?: string },
  ): Promise<unknown> {
    if (policy?.tenantId) {
      enforceMcpCallPolicyIngress({
        tenantId: policy.tenantId,
        toolId: name,
        executionId: policy.executionId ?? this.traceId,
        actorId: policy.actorId,
        logger: this.logger,
      });
    } else if (requireMcpPolicyContext()) {
      bumpMcpPolicyContextRejected();
      throw new Error("MCP_POLICY_CONTEXT_REQUIRED");
    } else {
      bumpPolicyContextMissing();
      this.logger.warn(
        {
          traceId: this.traceId,
          toolName: name,
          reasonCode: "POLICY_CONTEXT_MISSING",
          event: "mcp_policy_context_missing_warn",
        },
        "mcp_policy_context_missing_warn",
      );
    }
    await this.initialize();
    const id = this.transport.mintId();
    const res = await this.transport.send<{ content?: unknown }>({
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name, arguments: args },
    });
    if (res.error) {
      throw new Error(`MCP_TOOL_FAILED:${res.error.message}`);
    }
    return res.result;
  }
}
