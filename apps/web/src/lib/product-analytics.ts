/**
 * Phase 12C — tenant product analytics (API-backed, optional Plausible mirror).
 */
import type { ProductEventBody, ProductEventName } from "@botmate/shared";
import { apiClient } from "@/lib/api/client";
import { track } from "@/lib/analytics";
import { isRealAuthEnabled } from "@/lib/auth/config";

const DEDUPE_PREFIX = "milestone:";

export function productMilestoneDedupeKey(suffix: string): string {
  return `${DEDUPE_PREFIX}${suffix}`;
}

export function trackProductEvent(
  name: ProductEventName,
  opts?: {
    dedupeKey?: string;
    route?: string;
    props?: Record<string, string | number | boolean>;
  },
): void {
  // Verbose product-analytics console output muted to keep dev console clean.
  // Включайте через флаг `?debug=analytics` при необходимости.
  if (
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    /[?&]debug=analytics/.test(window.location.search)
  ) {
    // eslint-disable-next-line no-console
    console.info("[product-analytics]", name, opts ?? {});
  }

  if (typeof window !== "undefined") {
    track("cta-click", {
      location: "header",
      intent: `product:${name}`,
    });
  }

  if (!isRealAuthEnabled()) return;

  const body: ProductEventBody = {
    name,
    dedupeKey: opts?.dedupeKey,
    route: opts?.route ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
    props: opts?.props,
  };

  void apiClient.recordProductEvent(body).catch(() => {
    /* never block UX */
  });
}

/** Fire once per browser session for page-open style events. */
export function trackProductPageOnce(
  sessionKey: string,
  name: ProductEventName,
  dedupeKey: string,
): void {
  try {
    const k = `bm.product.page.${sessionKey}`;
    if (sessionStorage.getItem(k) === "1") return;
    sessionStorage.setItem(k, "1");
  } catch {
    /* ignore */
  }
  trackProductEvent(name, { dedupeKey });
}
