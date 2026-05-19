import { ToolExecutionEngine } from "@botmate/runtime";
import type { RegisteredToolDefinition } from "@botmate/runtime";
import { registerBrowserWorkspaceTools } from "./browser/register-browser-tools.js";
import { executeCreateLeadToolBody } from "./tools/create-lead-tool-body.js";

const createLeadDef: RegisteredToolDefinition = {
  id: "create_lead",
  description: "Create CRM lead from structured intent",
  riskTier: "standard",
  execute: async (ctx, args) => {
    const parsed = args as { name?: string; contact?: string };
    if (!parsed?.name || !parsed?.contact) {
      return { ok: false, error: { code: "TOOL_001", message: "Tool input is invalid" } };
    }
    return executeCreateLeadToolBody(ctx, {
      name: parsed.name,
      contact: parsed.contact,
    });
  },
};

export const workspaceToolEngine = new ToolExecutionEngine();

workspaceToolEngine.register(createLeadDef);
registerBrowserWorkspaceTools(workspaceToolEngine);
