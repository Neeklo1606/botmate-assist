import { AsyncLocalStorage } from "node:async_hooks";

export interface BrowserGateSnapshot {
  browserAllowedHosts: string[];
  browserMaxStepsPerRun: number;
  browserMaxArtifactsPerRun: number;
}

export interface BrowserToolRequestContext {
  gate: BrowserGateSnapshot;
  emit?: (chunk: string) => void;
}

export const browserToolCtxAls = new AsyncLocalStorage<BrowserToolRequestContext>();
