import {
  browserRealtimeEventsPerSecondCap,
  browserRealtimeThrottleBucketCap,
} from "../constants.js";

/** Naïve token bucket per logical emitter key (browserSessionId). */
export class BrowserRealtimeThrottle {
  private readonly buckets = new Map<string, { tokens: number; resetAt: number }>();

  private readonly bucketCap: number;

  /** Sampled pruning to avoid scanning the map on every allow(). */
  private ticks = 0;

  constructor(
    private readonly maxPerSec: number = browserRealtimeEventsPerSecondCap(),
    bucketCap: number = browserRealtimeThrottleBucketCap(),
  ) {
    this.bucketCap = bucketCap;
  }

  /** Returns false when should drop firehose frames. */
  allow(key: string): boolean {
    const now = Date.now();
    if ((++this.ticks & 63) === 0) this.pruneExpiredBuckets(now);

    let b = this.buckets.get(key);
    if (!b || now >= b.resetAt) {
      b = { tokens: this.maxPerSec, resetAt: now + 1000 };
      this.buckets.set(key, b);
      if (this.buckets.size > this.bucketCap) {
        this.pruneExpiredBuckets(now);
        this.trimToBucketCap();
      }
    }
    if (b.tokens <= 0) return false;
    b.tokens -= 1;
    return true;
  }

  private pruneExpiredBuckets(now: number): void {
    for (const [k, bucket] of this.buckets) {
      if (now >= bucket.resetAt) this.buckets.delete(k);
    }
  }

  /** Oldest-insertion keys drop first once expired pruning is insufficient (memory guard). */
  private trimToBucketCap(): void {
    while (this.buckets.size > this.bucketCap) {
      const oldest = this.buckets.keys().next().value;
      if (oldest === undefined) break;
      this.buckets.delete(oldest);
    }
  }
}
