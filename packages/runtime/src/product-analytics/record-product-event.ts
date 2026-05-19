import type { PrismaClient } from "@botmate/database";
import type { ProductEventName } from "@botmate/shared";
import { bumpProductEventDeduped, bumpProductEventIngested } from "./product-support-metrics.js";

export function isProductAnalyticsEnabled(): boolean {
  const v = process.env.BOTMATE_PRODUCT_ANALYTICS_ENABLED?.trim();
  return v !== "false" && v !== "0";
}

export type RecordProductEventInput = {
  prisma: PrismaClient;
  tenantId: string;
  userId?: string | null;
  name: ProductEventName;
  dedupeKey?: string;
  route?: string;
  props?: Record<string, string | number | boolean>;
};

export async function recordProductEvent(input: RecordProductEventInput): Promise<{
  recorded: boolean;
  deduped: boolean;
}> {
  if (!isProductAnalyticsEnabled()) {
    return { recorded: false, deduped: false };
  }

  if (input.dedupeKey) {
    const existing = await input.prisma.productAnalyticsEvent.findUnique({
      where: {
        tenantId_dedupeKey: { tenantId: input.tenantId, dedupeKey: input.dedupeKey },
      },
      select: { id: true },
    });
    if (existing) {
      bumpProductEventDeduped();
      return { recorded: false, deduped: true };
    }
  }

  try {
    await input.prisma.productAnalyticsEvent.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId ?? null,
        name: input.name,
        dedupeKey: input.dedupeKey ?? null,
        route: input.route ?? null,
        props: input.props ?? undefined,
      },
    });
    bumpProductEventIngested();
    return { recorded: true, deduped: false };
  } catch (err) {
    if (input.dedupeKey && isUniqueViolation(err)) {
      bumpProductEventDeduped();
      return { recorded: false, deduped: true };
    }
    throw err;
  }
}

export function recordProductEventFireAndForget(input: RecordProductEventInput): void {
  void recordProductEvent(input).catch(() => {
    /* never block product paths on analytics */
  });
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}
