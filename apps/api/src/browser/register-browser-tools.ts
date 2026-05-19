import type { RegisteredToolDefinition } from "@botmate/runtime";
import type { BrowserToolId } from "@botmate/browser-runtime";
import { browserToolCtxAls } from "./browser-tool-context.js";
import type { BrowserGateSnapshot } from "./browser-tool-context.js";
import { executeQueuedBrowserTool } from "./execute-browser-tool.js";

export type { BrowserGateSnapshot };

export function registerBrowserWorkspaceTools(engine: { register(def: RegisteredToolDefinition): void }): void {
  const ids: BrowserToolId[] = [
    "browser.open",
    "browser.click",
    "browser.type",
    "browser.extract",
    "browser.wait",
    "browser.screenshot",
    "browser.close",
  ];

  for (const id of ids) {
    engine.register({
      id,
      riskTier: "standard",
      execute: async (ctx, args) => {
        const store = browserToolCtxAls.getStore();
        const snap = store?.gate;
        if (!snap) {
          return { ok: false, error: { code: "BROWSER_GATE_MISSING", message: "Browser gate context missing" } };
        }
        return executeQueuedBrowserTool({
          toolId: id,
          ctx,
          args,
          emitBrowserStream: store?.emit,
          browserAllowedHosts: snap.browserAllowedHosts,
          browserMaxStepsPerRun: snap.browserMaxStepsPerRun,
          browserMaxArtifactsPerRun: snap.browserMaxArtifactsPerRun,
        });
      },
    });
  }
}
