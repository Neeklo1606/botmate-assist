/** Feature gate — default off for rollback safety. */
export function isBrowserRuntimeEnabled(): boolean {
  return process.env.BROWSER_RUNTIME_ENABLED === "true";
}

export const BROWSER_TOOL_IDS = [
  "browser.open",
  "browser.click",
  "browser.type",
  "browser.extract",
  "browser.wait",
  "browser.screenshot",
  "browser.close",
] as const;

export type BrowserToolId = (typeof BROWSER_TOOL_IDS)[number];

export const BROWSER_TOOL_ID_SET = new Set<string>(BROWSER_TOOL_IDS);

export function browserSyncWaitMs(): number {
  const v = Number(process.env.BROWSER_TOOL_SYNC_WAIT_MS ?? "45000");
  return Math.min(120_000, Math.max(3000, v));
}

export function browserMaxStepsPerRun(): number {
  const v = Number(process.env.BROWSER_MAX_STEPS_PER_RUN ?? "24");
  return Math.min(48, Math.max(1, Math.floor(v)));
}

export function browserMaxArtifactsPerRun(): number {
  const v = Number(process.env.BROWSER_MAX_ARTIFACTS_PER_RUN ?? "10");
  return Math.min(50, Math.max(1, Math.floor(v)));
}

export function browserMaxRunsPerTenantDay(): number {
  const v = Number(process.env.BROWSER_MAX_RUNS_PER_TENANT_DAY ?? "400");
  return Math.min(50_000, Math.max(10, Math.floor(v)));
}

export function browserArtifactTtlMs(): number {
  const hours = Number(process.env.BROWSER_ARTIFACT_TTL_HOURS ?? "168");
  return Math.min(720, Math.max(1, hours)) * 3600_000;
}

export function browserIdleSoftMs(): number {
  const v = Number(process.env.BROWSER_SESSION_IDLE_MS ?? `${900_000}`);
  return Math.min(86_400_000, Math.max(60_000, v));
}

export function browserLeaseMs(): number {
  const v = Number(process.env.BROWSER_LEASE_MS ?? `${180_000}`);
  return Math.min(600_000, Math.max(30_000, v));
}

/** Redis realtime envelope throttle — events/sec per session during a run. */
export function browserRealtimeEventsPerSecondCap(): number {
  const v = Number(process.env.BROWSER_REALTIME_EVENTS_PER_SEC ?? "18");
  return Math.min(50, Math.max(4, Math.floor(v)));
}

/** Bounds token-bucket Map growth in BrowserRealtimeThrottle (Phase 10A). */
export function browserRealtimeThrottleBucketCap(): number {
  const v = Number(process.env.BROWSER_REALTIME_THROTTLE_BUCKET_CAP ?? "8192");
  return Math.min(50_000, Math.max(256, Math.floor(v)));
}

/** Phase 5D — operator observe/join/takeover browser feed (additive feature gate). */
export function isOperatorBrowserEnabled(): boolean {
  return process.env.OPERATOR_BROWSER_ENABLED === "true";
}

export function operatorObserveLeaseMs(): number {
  const v = Number(process.env.OPERATOR_LEASE_MS ?? `${600_000}`);
  return Math.min(3_600_000, Math.max(60_000, v));
}

export function operatorTakeoverLeaseMs(): number {
  const v = Number(process.env.OPERATOR_TAKEOVER_LEASE_MS ?? `${900_000}`);
  return Math.min(3_600_000, Math.max(120_000, v));
}

export function operatorFeedSnapshotMinIntervalMs(): number {
  const v = Number(process.env.OPERATOR_FEED_SNAPSHOT_MIN_INTERVAL_MS ?? `${4000}`);
  return Math.min(120_000, Math.max(1500, v));
}

export function operatorFeedArtifactsRotationKeep(): number {
  const v = Number(process.env.OPERATOR_FEED_ARTIFACT_ROTATION_KEEP ?? `12`);
  return Math.min(100, Math.max(3, Math.floor(v)));
}

/** Separate throttle budget from automated browser.run realtime bursts. */
export function operatorFeedRealtimeEventsPerSecondCap(): number {
  const v = Number(process.env.OPERATOR_FEED_EVENTS_PER_SEC ?? `4`);
  return Math.min(20, Math.max(1, Math.floor(v)));
}
