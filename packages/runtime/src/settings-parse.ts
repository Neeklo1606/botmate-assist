import type { ProviderId } from "./model-router.js";
import { normalizeProviderHint } from "./model-router.js";

export interface ParsedAssistantRuntimeSettings {
  providerHint: ProviderId;
  modelId: string;
  temperature: number;
  systemPrompt: string;
  userTemplate: string;
  enabledTools: string[];
  /** Tenant-scoped ids validated server-side against `KnowledgeBase.tenantId`. */
  knowledgeBaseIds: string[];
  ragTopK: number;
  ragMaxContextTokens: number;
  ragDisabled: boolean;
  embeddingModelHint?: string;
  /** Explicit whitelist for `riskTier: dangerous` tools (ADMIN/OWNER only). */
  dangerousToolsEnabled: string[];
  /** Hostnames allowed for HTTP/MCP fetch transports (lowercased). */
  toolHttpAllowedHosts: string[];
  /** Default tool timeout budget for synchronous execution (ms). */
  toolTimeoutMs: number;
  toolMaxRetries: number;
  /** Feature flag — MCP endpoint comes from env; settings gate discovery/exposure. */
  toolsMcpEnabled: boolean;
  /** Phase 5C browser automation gate — requires `BROWSER_RUNTIME_ENABLED=true` server-side too. */
  browserEnabled: boolean;
  browserAllowedHosts: string[];
  browserMaxStepsPerRun: number;
  browserMaxArtifactsPerRun: number;
}

export function parseAssistantRuntimeSettings(raw: unknown): ParsedAssistantRuntimeSettings {
  const defaults: ParsedAssistantRuntimeSettings = {
    providerHint: "openai",
    modelId: "gpt-4o-mini",
    temperature: 0.7,
    systemPrompt: "",
    userTemplate: "",
    enabledTools: [],
    knowledgeBaseIds: [],
    ragTopK: 8,
    ragMaxContextTokens: 4096,
    ragDisabled: false,
    embeddingModelHint: undefined,
    dangerousToolsEnabled: [],
    toolHttpAllowedHosts: [],
    toolTimeoutMs: 30_000,
    toolMaxRetries: 2,
    toolsMcpEnabled: false,
    browserEnabled: false,
    browserAllowedHosts: [],
    browserMaxStepsPerRun: 24,
    browserMaxArtifactsPerRun: 10,
  };

  if (!raw || typeof raw !== "object") return defaults;
  const o = raw as Record<string, unknown>;

  const ai = o.ai && typeof o.ai === "object" ? (o.ai as Record<string, unknown>) : {};
  const model = o.model && typeof o.model === "object" ? (o.model as Record<string, unknown>) : {};
  const prompt = o.prompt && typeof o.prompt === "object" ? (o.prompt as Record<string, unknown>) : {};
  const tools = o.tools && typeof o.tools === "object" ? (o.tools as Record<string, unknown>) : {};
  const knowledge =
    o.knowledge && typeof o.knowledge === "object" ? (o.knowledge as Record<string, unknown>) : {};

  const providerHint = normalizeProviderHint(typeof ai.provider === "string" ? ai.provider : undefined);
  const modelId = typeof model.id === "string" && model.id.trim() ? model.id.trim() : defaults.modelId;
  const temperature =
    typeof model.temperature === "number" && Number.isFinite(model.temperature) ? model.temperature : defaults.temperature;

  const enabledTools =
    Array.isArray(tools.enabled) ? tools.enabled.map((x) => String(x)).filter(Boolean) : defaults.enabledTools;

  const rawKbIds = Array.isArray(knowledge.knowledgeBaseIds)
    ? knowledge.knowledgeBaseIds
    : Array.isArray(knowledge.baseIds)
      ? knowledge.baseIds
      : [];
  const knowledgeBaseIds = rawKbIds.map((x) => String(x)).filter(Boolean).slice(0, 64);

  const ragTopKRaw =
    typeof knowledge.ragTopK === "number" && Number.isFinite(knowledge.ragTopK) ?
      Math.floor(knowledge.ragTopK)
    : defaults.ragTopK;
  const ragTopK = Math.min(48, Math.max(1, ragTopKRaw));

  const ragTokensRaw =
    typeof knowledge.ragMaxContextTokens === "number" && Number.isFinite(knowledge.ragMaxContextTokens) ?
      Math.floor(knowledge.ragMaxContextTokens)
    : defaults.ragMaxContextTokens;
  const ragMaxContextTokens = Math.min(16_000, Math.max(400, ragTokensRaw));

  const ragDisabled = knowledge.disabled === true;

  const embeddingModelHint =
    typeof knowledge.embeddingModel === "string" && knowledge.embeddingModel.trim() ?
      knowledge.embeddingModel.trim()
    : undefined;

  const rawDangerous =
    Array.isArray(tools.dangerousEnabled) ? tools.dangerousEnabled : Array.isArray(tools.dangerousTools) ? tools.dangerousTools : [];
  const dangerousToolsEnabled = rawDangerous.map((x) => String(x)).filter(Boolean).slice(0, 64);

  const rawHttpHosts = Array.isArray(tools.httpAllowedHosts) ? tools.httpAllowedHosts : [];
  const toolHttpAllowedHosts = rawHttpHosts.map((h) => String(h).trim().toLowerCase()).filter(Boolean).slice(0, 48);

  const toolTimeoutRaw =
    typeof tools.timeoutMs === "number" && Number.isFinite(tools.timeoutMs) ?
      Math.floor(tools.timeoutMs)
    : defaults.toolTimeoutMs;
  const toolTimeoutMs = Math.min(120_000, Math.max(1000, toolTimeoutRaw));

  const retriesRaw =
    typeof tools.retries === "number" && Number.isFinite(tools.retries) ? Math.floor(tools.retries) : defaults.toolMaxRetries;
  const toolMaxRetries = Math.min(8, Math.max(0, retriesRaw));

  const toolsMcpEnabled = tools.mcpEnabled === true;

  const browserEnabled = tools.browserEnabled === true;
  const rawBrowserHosts = Array.isArray(tools.browserAllowedHosts) ? tools.browserAllowedHosts : [];
  const browserAllowedHosts = rawBrowserHosts.map((h) => String(h).trim().toLowerCase()).filter(Boolean).slice(0, 48);

  const browserStepsRaw =
    typeof tools.browserMaxStepsPerRun === "number" && Number.isFinite(tools.browserMaxStepsPerRun) ?
      Math.floor(tools.browserMaxStepsPerRun)
    : defaults.browserMaxStepsPerRun;
  const browserMaxStepsPerRun = Math.min(48, Math.max(1, browserStepsRaw));

  const browserArtifactsRaw =
    typeof tools.browserMaxArtifactsPerRun === "number" && Number.isFinite(tools.browserMaxArtifactsPerRun) ?
      Math.floor(tools.browserMaxArtifactsPerRun)
    : defaults.browserMaxArtifactsPerRun;
  const browserMaxArtifactsPerRun = Math.min(50, Math.max(1, browserArtifactsRaw));

  return {
    providerHint,
    modelId,
    temperature,
    systemPrompt: typeof prompt.system === "string" ? prompt.system : defaults.systemPrompt,
    userTemplate: typeof prompt.userTemplate === "string" ? prompt.userTemplate : defaults.userTemplate,
    enabledTools,
    knowledgeBaseIds,
    ragTopK,
    ragMaxContextTokens,
    ragDisabled,
    embeddingModelHint,
    dangerousToolsEnabled,
    toolHttpAllowedHosts,
    toolTimeoutMs,
    toolMaxRetries,
    toolsMcpEnabled,
    browserEnabled,
    browserAllowedHosts,
    browserMaxStepsPerRun,
    browserMaxArtifactsPerRun,
  };
}
