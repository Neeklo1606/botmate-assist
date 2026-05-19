-- Phase 12C — product analytics + feedback

CREATE TABLE "ProductAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "name" VARCHAR(128) NOT NULL,
    "dedupeKey" VARCHAR(128),
    "props" JSONB,
    "route" VARCHAR(512),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductFeedback" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" VARCHAR(64) NOT NULL,
    "message" TEXT NOT NULL,
    "route" VARCHAR(512),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductAnalyticsEvent_tenantId_dedupeKey_key" ON "ProductAnalyticsEvent"("tenantId", "dedupeKey");

CREATE INDEX "ProductAnalyticsEvent_tenantId_name_createdAt_idx" ON "ProductAnalyticsEvent"("tenantId", "name", "createdAt" DESC);

CREATE INDEX "ProductAnalyticsEvent_tenantId_createdAt_idx" ON "ProductAnalyticsEvent"("tenantId", "createdAt" DESC);

CREATE INDEX "ProductFeedback_tenantId_createdAt_idx" ON "ProductFeedback"("tenantId", "createdAt" DESC);

CREATE INDEX "ProductFeedback_category_createdAt_idx" ON "ProductFeedback"("category", "createdAt" DESC);

ALTER TABLE "ProductAnalyticsEvent" ADD CONSTRAINT "ProductAnalyticsEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductAnalyticsEvent" ADD CONSTRAINT "ProductAnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductFeedback" ADD CONSTRAINT "ProductFeedback_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductFeedback" ADD CONSTRAINT "ProductFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
