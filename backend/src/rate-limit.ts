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
