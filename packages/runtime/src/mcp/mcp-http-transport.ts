import type { McpJsonRpcRequest, McpJsonRpcResponse } from "./mcp-types.js";
import type { McpTransport } from "./mcp-transport.js";
import { assertSafeHttpUrl } from "../tools/ssrf.js";

/** Fetch-based MCP JSON-RPC bridge — hostname pinned via allowlist (trust boundary). */
export class McpHttpTransport implements McpTransport {
  private nextId = 1;

  constructor(
    private readonly endpoint: string,
    private readonly allowedHosts: ReadonlySet<string>,
    private readonly headers: Record<string, string>,
    private readonly timeoutMs: number,
  ) {
    assertSafeHttpUrl(endpoint, allowedHosts);
  }

  async send<TResult = unknown>(req: McpJsonRpcRequest): Promise<McpJsonRpcResponse<TResult>> {
    const url = assertSafeHttpUrl(this.endpoint, this.allowedHosts);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...this.headers,
        },
        body: JSON.stringify(req),
        signal: controller.signal,
      });
      const json = (await res.json()) as McpJsonRpcResponse<TResult>;
      return json;
    } finally {
      clearTimeout(timer);
    }
  }

  async dispose(): Promise<void> {
    /* noop */
  }

  mintId(): number {
    return this.nextId++;
  }
}
