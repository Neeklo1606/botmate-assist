import type { McpJsonRpcRequest, McpJsonRpcResponse } from "./mcp-types.js";

export interface McpTransport {
  /** POST JSON-RPC envelope — implementations enforce SSRF / TLS policies. */
  send<TResult = unknown>(req: McpJsonRpcRequest): Promise<McpJsonRpcResponse<TResult>>;
  dispose(): Promise<void>;
}
