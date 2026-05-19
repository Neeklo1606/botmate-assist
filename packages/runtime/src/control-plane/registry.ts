import type { RuntimeHealthStatus, RuntimeSubsystem } from "@botmate/shared";

function flagEnabled(key: string): boolean {
  return process.env[key]?.trim().toLowerCase() === "true";
}

function subsystemHealth(enabled: boolean): RuntimeHealthStatus {
  return enabled ? "healthy" : "disabled";
}

export interface RuntimeRegistrySubsystemSnapshot {
  id: RuntimeSubsystem;
  displayName: string;
  capabilities: string[];
  health: RuntimeHealthStatus;
  featureFlags: Record<string, boolean>;
}

export interface RuntimeRegistrySnapshot {
  controlPlaneEnabled: boolean;
  controlPlaneVersion: string;
  governanceEnabled: boolean;
  drainMode: string | null;
  emergencyDisableRaw: string | null;
  gitSha: string | null;
  subsystems: RuntimeRegistrySubsystemSnapshot[];
}

export function buildRuntimeRegistrySnapshot(): RuntimeRegistrySnapshot {
  const assistantEnabled = true;
  const browserEnabled = flagEnabled("BROWSER_RUNTIME_ENABLED");
  const operatorEnabled = flagEnabled("OPERATOR_BROWSER_ENABLED");
  const realtimeEnabled = true;
  const queuesEnabled = Boolean(process.env.REDIS_URL?.trim());
  const ragEnabled = true;
  const notificationsEnabled = true;

  const subsystems: RuntimeRegistrySubsystemSnapshot[] = [
    {
      id: "assistant",
      displayName: "Assistant runtime",
      capabilities: ["chat_turn_execution", "assistant_run_job"],
      health: subsystemHealth(assistantEnabled),
      featureFlags: {
        streamingSse: true,
      },
    },
    {
      id: "browser",
      displayName: "Browser automation runtime",
      capabilities: ["browser_run", "playwright_chromium"],
      health: subsystemHealth(browserEnabled),
      featureFlags: {
        browserRuntimeEnabled: browserEnabled,
      },
    },
    {
      id: "tool",
      displayName: "ToolExecutionEngine",
      capabilities: ["sync_tools", "async_tools_stub"],
      health: subsystemHealth(true),
      featureFlags: {},
    },
    {
      id: "realtime",
      displayName: "Realtime WS / Redis bridge",
      capabilities: ["websocket_gateway", "redis_pubsub_optional"],
      health: subsystemHealth(realtimeEnabled),
      featureFlags: {},
    },
    {
      id: "queue",
      displayName: "BullMQ worker plane",
      capabilities: ["bullmq_streams"],
      health: subsystemHealth(queuesEnabled),
      featureFlags: {
        redisConfigured: queuesEnabled,
      },
    },
    {
      id: "operator",
      displayName: "Operator browser supervision",
      capabilities: ["observe_join_takeover_leases", "browser_feed_snapshot_jobs"],
      health: subsystemHealth(operatorEnabled && browserEnabled),
      featureFlags: {
        operatorBrowserEnabled: operatorEnabled,
      },
    },
    {
      id: "rag",
      displayName: "RAG retrieval runtime",
      capabilities: ["runtime_rag_pack"],
      health: subsystemHealth(ragEnabled),
      featureFlags: {},
    },
    {
      id: "notifications",
      displayName: "Notifications dispatch",
      capabilities: ["notifications_queue"],
      health: subsystemHealth(notificationsEnabled && queuesEnabled),
      featureFlags: {},
    },
  ];

  return {
    controlPlaneEnabled: flagEnabled("CONTROL_PLANE_ENABLED"),
    controlPlaneVersion: process.env.CONTROL_PLANE_SEMVER?.trim() || "6a.0",
    governanceEnabled: process.env.CONTROL_PLANE_GOVERNANCE_ENABLED !== "false",
    drainMode: process.env.RUNTIME_DRAIN_MODE?.trim() ?? null,
    emergencyDisableRaw: process.env.RUNTIME_EMERGENCY_DISABLE?.trim() ?? null,
    gitSha: process.env.GIT_COMMIT_SHA?.trim() ?? process.env.K_REVISION?.trim() ?? null,
    subsystems,
  };
}
