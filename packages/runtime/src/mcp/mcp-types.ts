/** Minimal MCP-aligned structures — transport-specific framing may wrap JSON-RPC. */

export interface McpToolDescriptor {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface McpJsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: unknown;
}

export interface McpJsonRpcResponse<TResult = unknown> {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: TResult;
  error?: { code: number; message: string; data?: unknown };
}
