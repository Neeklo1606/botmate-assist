import type { McpToolDescriptor } from "./mcp-types.js";

/** Namespace MCP tools to avoid collisions with internal/http/async ids. */
export function qualifyMcpToolId(serverSlug: string, toolName: string): string {
  const slug = serverSlug.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `mcp:${slug}:${toolName}`;
}

export class McpCapabilityRegistry {
  private readonly byQualifiedId = new Map<string, McpToolDescriptor & { qualifiedId: string }>();

  merge(serverSlug: string, tools: McpToolDescriptor[]): void {
    for (const t of tools) {
      const qualifiedId = qualifyMcpToolId(serverSlug, t.name);
      this.byQualifiedId.set(qualifiedId, { ...t, qualifiedId });
    }
  }

  snapshot(): Array<McpToolDescriptor & { qualifiedId: string }> {
    return [...this.byQualifiedId.values()];
  }

  size(): number {
    return this.byQualifiedId.size;
  }
}
