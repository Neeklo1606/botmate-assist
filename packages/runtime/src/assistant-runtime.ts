import type { PrismaClient } from "@botmate/database";
import { decryptIntegrationPayload, getEncryptionMasterKeyFromEnv } from "./crypto-env.js";
import type { RuntimeLogger } from "./tracing.js";

import type { ParsedAssistantRuntimeSettings } from "./settings-parse.js";

export class AssistantRuntime {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: RuntimeLogger,
  ) {}

  async loadAssistantRow(tenantId: string, assistantId: string) {
    const row = await this.prisma.assistant.findFirst({
      where: { id: assistantId, tenantId },
      select: { id: true, tenantId: true, ownerUserId: true, settings: true },
    });
    if (!row) {
      throw new Error("ASSISTANT_NOT_FOUND");
    }
    return row;
  }

  async loadActiveSessionRow(tenantId: string, sessionId: string) {
    const row = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, tenantId, archivedAt: null },
      select: { id: true, tenantId: true, assistantId: true },
    });
    if (!row) {
      throw new Error("SESSION_NOT_FOUND");
    }
    return row;
  }

  async decryptOpenAiForOwner(ownerUserId: string): Promise<string | null> {
    const row = await this.prisma.integrationAccount.findFirst({
      where: { userId: ownerUserId, provider: "OPENAI", isActive: true },
    });
    if (!row) return null;
    const mk = getEncryptionMasterKeyFromEnv();
    return decryptIntegrationPayload(row.apiKeyEncrypted, mk);
  }

  logLifecycle(traceId: string, phase: string, meta?: Record<string, unknown>): void {
    this.logger.info({ traceId, phase, ...meta }, "assistant_runtime_lifecycle");
  }

  /** Bounded snapshot for queued-worker telemetry (`PHASE5A_REPORT.md`). */
  describeToolSurface(settings: ParsedAssistantRuntimeSettings): Record<string, unknown> {
    return {
      enabledToolCount: settings.enabledTools.length,
      dangerousWhitelistCount: settings.dangerousToolsEnabled.length,
      httpAllowHostCount: settings.toolHttpAllowedHosts.length,
      toolsMcpEnabled: settings.toolsMcpEnabled,
      toolTimeoutMs: settings.toolTimeoutMs,
      toolMaxRetries: settings.toolMaxRetries,
      mcpEndpointConfigured: Boolean(process.env.MCP_HTTP_ENDPOINT?.trim()),
      browserAssistantFlag: settings.browserEnabled,
      browserNavigationHostsCount: settings.browserAllowedHosts.length,
      browserMaxStepsPerRun: settings.browserMaxStepsPerRun,
      browserMaxArtifactsPerRun: settings.browserMaxArtifactsPerRun,
      browserRuntimeEnvEnabled: process.env.BROWSER_RUNTIME_ENABLED === "true",
      browserNavigationAllowlistConfigured: Boolean(process.env.BROWSER_NAVIGATION_ALLOWLIST?.trim()),
    };
  }
}
