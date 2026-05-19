import { useEffect } from "react";
import type { ProductEventName } from "@botmate/shared";
import { productMilestoneDedupeKey, trackProductPageOnce } from "@/lib/product-analytics";

/** Records a milestone page view once per browser session. */
export function useProductPageView(input: {
  sessionKey: string;
  event: ProductEventName;
  milestoneSuffix: string;
  enabled?: boolean;
}): void {
  const enabled = input.enabled !== false;
  useEffect(() => {
    if (!enabled) return;
    trackProductPageOnce(
      input.sessionKey,
      input.event,
      productMilestoneDedupeKey(input.milestoneSuffix),
    );
  }, [enabled, input.sessionKey, input.event, input.milestoneSuffix]);
}
