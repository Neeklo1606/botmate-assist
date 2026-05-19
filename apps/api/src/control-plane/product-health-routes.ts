import type { FastifyInstance } from "fastify";
import { prisma } from "@botmate/database";
import { FleetProductAnalyticsSnapshotSchema } from "@botmate/shared";
import {
  buildFleetProductAnalyticsSnapshot,
  isProductAnalyticsEnabled,
  productSupportMetricsSnapshot,
} from "@botmate/runtime";

export function isProductAnalyticsInternalHealthEnabled(): boolean {
  const v = process.env.BOTMATE_PRODUCT_ANALYTICS_INTERNAL_HEALTH?.trim();
  return v === "true" || v === "1";
}

export function registerProductHealthRoutes(app: FastifyInstance): void {
  app.get("/health/product", async () => {
    if (!isProductAnalyticsEnabled()) {
      return { ok: true, enabled: false };
    }

    const supportMetrics = productSupportMetricsSnapshot();

    if (!isProductAnalyticsInternalHealthEnabled()) {
      return {
        ok: true,
        enabled: true,
        fleetDetail: "redacted",
        supportMetrics,
      };
    }

    const fleet = await buildFleetProductAnalyticsSnapshot(prisma);
    return {
      ok: true,
      enabled: true,
      fleet: FleetProductAnalyticsSnapshotSchema.parse(fleet),
      supportMetrics,
    };
  });
}
