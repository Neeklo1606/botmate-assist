-- Phase 3B: durable notifications + delivery states for realtime/worker foundation.

CREATE TYPE "NotificationDeliveryState" AS ENUM ('pending', 'queued', 'delivered', 'failed');

CREATE TYPE "NotificationKind" AS ENUM ('system', 'mention', 'job');

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" JSONB,
    "readAt" TIMESTAMP(3),
    "deliveryState" "NotificationDeliveryState" NOT NULL DEFAULT 'pending',
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Notification_tenantId_userId_readAt_idx" ON "Notification"("tenantId", "userId", "readAt");

CREATE INDEX "Notification_tenantId_createdAt_idx" ON "Notification"("tenantId", "createdAt" DESC);

CREATE INDEX "Notification_correlationId_idx" ON "Notification"("correlationId");
