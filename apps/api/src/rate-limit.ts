const counters = new Map<string, number>();

function currentMinuteBucket(): number {
  return Math.floor(Date.now() / 60000);
}

export function checkApiKeyRateLimit(input: {
  apiKeyId: string;
  limitPerMin: number;
}): { allowed: true } | { allowed: false } {
  const bucket = currentMinuteBucket();
  const counterKey = `${input.apiKeyId}:${bucket}`;
  const next = (counters.get(counterKey) ?? 0) + 1;
  counters.set(counterKey, next);

  // Lightweight cleanup for stale minute buckets.
  for (const key of counters.keys()) {
    const [, minute] = key.split(":");
    if (!minute) continue;
    if (Number(minute) < bucket - 2) {
      counters.delete(key);
    }
  }

  if (next > input.limitPerMin) {
    return { allowed: false };
  }
  return { allowed: true };
}

function checkCounter(input: { key: string; limitPerMin: number }): { allowed: boolean } {
  const bucket = currentMinuteBucket();
  const counterKey = `${input.key}:${bucket}`;
  const next = (counters.get(counterKey) ?? 0) + 1;
  counters.set(counterKey, next);

  for (const key of counters.keys()) {
    const maybeMinute = key.split(":").at(-1);
    if (!maybeMinute) continue;
    if (Number(maybeMinute) < bucket - 2) {
      counters.delete(key);
    }
  }
  return { allowed: next <= input.limitPerMin };
}

export function checkIpRateLimit(input: {
  ip: string;
  limitPerMin: number;
}): { allowed: true } | { allowed: false } {
  const checked = checkCounter({
    key: `ip:${input.ip}`,
    limitPerMin: input.limitPerMin,
  });
  return checked.allowed ? { allowed: true } : { allowed: false };
}

export function checkTenantRateLimit(input: {
  tenantId: string;
  limitPerMin: number;
  scope?: string;
}): { allowed: true } | { allowed: false } {
  const checked = checkCounter({
    key: `tenant:${input.scope ?? "default"}:${input.tenantId}`,
    limitPerMin: input.limitPerMin,
  });
  return checked.allowed ? { allowed: true } : { allowed: false };
}
